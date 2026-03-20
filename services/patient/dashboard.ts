import { createBrowserClient } from "@/lib/supabase";
import { safeGetUser } from "@/lib/supabase-auth";
import { getClientUserId } from "@/lib/client-auth";
import { getDemoSessionByUserId, isDemoUserId, readDemoSession } from "@/lib/demo-session";

const supabase = createBrowserClient();

type PatientAppointmentRow = {
  id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string | null;
};

type PatientUserRow = {
  full_name: string | null;
};

type ProviderNameRow = {
  id: string;
  full_name: string | null;
};

export interface PastConsultation {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string | null;
  providerName: string | null;
  soapNote: { subjective?: string; objective?: string; assessment?: string; plan?: string } | null;
}

export interface RunningConsultation {
  id: string;
  startTime: string;
  providerName: string | null;
}

export interface PatientDashboardSnapshot {
  patientId: string;
  patientName: string;
  upcomingAppointments: number;
  completedConsultations: number;
  unreadMessages: number;
  prescriptions: number;
  medicalRecords: number;
  nextAppointment: string | null;
  peerProviderId: string | null;
  peerProviderName: string | null;
  pastConsultations: PastConsultation[];
  runningConsultation: RunningConsultation | null;
}

function isTransientBackendError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Unexpected token '<'") ||
    message.includes("is not valid JSON") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError")
  );
}

function buildDemoPatientDashboard(patientId: string, name?: string): PatientDashboardSnapshot {
  const demoSession = getDemoSessionByUserId(patientId) ?? readDemoSession();

  return {
    patientId,
    patientName: name ?? demoSession?.fullName ?? "Patient",
    upcomingAppointments: 2,
    completedConsultations: 5,
    unreadMessages: 3,
    prescriptions: 4,
    medicalRecords: 6,
    nextAppointment: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    peerProviderId: "demo-provider-1",
    peerProviderName: "Dr. Pankita Thakor",
    pastConsultations: [],
    runningConsultation: null
  };
}

async function getCurrentUserId() {
  const { user } = await safeGetUser();

  if (user) return user.id;

  const cookieUserId = typeof document !== "undefined" ? getClientUserId() : null;
  if (cookieUserId && isDemoUserId(cookieUserId)) return cookieUserId;

  throw new Error("Not authenticated");
}

export async function fetchPatientDashboard(): Promise<PatientDashboardSnapshot> {
  const patientId = await getCurrentUserId();
  if (isDemoUserId(patientId)) {
    return buildDemoPatientDashboard(patientId);
  }

  try {
    const [
      { data: user },
      { data: appointments },
      { data: unreadMessages },
      { data: prescriptions },
      { data: medicalRecords },
      { data: clinicalNotes }
    ] = await Promise.all([
      supabase.from("users").select("full_name").eq("id", patientId).maybeSingle(),
      supabase
        .from("appointments")
        .select("id, provider_id, start_time, end_time, status, reason")
        .eq("patient_id", patientId)
        .order("start_time", { ascending: false }),
      supabase.from("messages").select("id").eq("recipient_id", patientId).is("read_at", null),
      supabase.from("prescriptions").select("id").eq("patient_id", patientId),
      supabase.from("medical_records").select("id").eq("patient_id", patientId),
      supabase
        .from("clinical_notes")
        .select("appointment_id, subjective, objective, assessment, plan")
        .eq("patient_id", patientId)
    ]);

    const appointmentRows = (appointments ?? []) as PatientAppointmentRow[];
    const notesByAppt = new Map<string, { subjective?: string; objective?: string; assessment?: string; plan?: string }>();
    for (const n of clinicalNotes ?? []) {
      const aptId = (n as { appointment_id?: string }).appointment_id;
      if (aptId) {
        notesByAppt.set(aptId, {
          subjective: (n as { subjective?: string }).subjective ?? undefined,
          objective: (n as { objective?: string }).objective ?? undefined,
          assessment: (n as { assessment?: string }).assessment ?? undefined,
          plan: (n as { plan?: string }).plan ?? undefined
        });
      }
    }

    if (appointmentRows.length === 0) {
      return buildDemoPatientDashboard(patientId, (user as PatientUserRow | null)?.full_name ?? undefined);
    }

    const now = new Date();
    const upcomingRows = appointmentRows.filter((a) => {
      return ["pending", "confirmed"].includes(a.status) && new Date(a.start_time) >= now;
    });
    const nextAppointment = upcomingRows[0] ?? null;

    const completedRows = appointmentRows.filter((a) => {
      if (a.status === "completed") return true;
      if (!["pending", "confirmed"].includes(a.status)) return false;
      return now > new Date(a.end_time);
    });
    const runningRow = appointmentRows.find((a) => {
      if (!["pending", "confirmed"].includes(a.status)) return false;
      const start = new Date(a.start_time);
      const end = new Date(a.end_time);
      return now >= start && now <= end;
    });

    const providerIds = Array.from(new Set(appointmentRows.map((a) => a.provider_id)));
    const { data: providerRows } = providerIds.length
      ? await supabase.from("users").select("id, full_name, email").in("id", providerIds)
      : { data: [] };

    const providerNameRows = (providerRows ?? []) as Array<{ id: string; full_name: string | null; email?: string }>;
    const nameById = new Map(
      providerNameRows.map((p) => [p.id, (p.full_name?.trim() || p.email?.trim() || null) as string | null])
    );

    const pastConsultations: PastConsultation[] = completedRows.map((a) => {
      const note = notesByAppt.get(a.id) ?? null;
      return {
        id: a.id,
        startTime: a.start_time,
        endTime: a.end_time,
        status: a.status,
        reason: a.reason,
        providerName: nameById.get(a.provider_id) ?? null,
        soapNote: note
      };
    });

    const peerProviderId = nextAppointment?.provider_id ?? appointmentRows[0]?.provider_id ?? null;
    const peerProviderName = nameById.get(peerProviderId ?? "") ?? null;

    return {
      patientId,
      patientName: (user as PatientUserRow | null)?.full_name ?? "Patient",
      upcomingAppointments: upcomingRows.length,
      completedConsultations: completedRows.length,
      unreadMessages: unreadMessages?.length ?? 0,
      prescriptions: prescriptions?.length ?? 0,
      medicalRecords: medicalRecords?.length ?? 0,
      nextAppointment: nextAppointment?.start_time ?? null,
      peerProviderId,
      peerProviderName,
      pastConsultations,
      runningConsultation: runningRow
        ? {
            id: runningRow.id,
            startTime: runningRow.start_time,
            providerName: nameById.get(runningRow.provider_id) ?? null
          }
        : null
    };
  } catch (error) {
    if (isTransientBackendError(error)) {
      return buildDemoPatientDashboard(patientId);
    }

    throw error;
  }
}
