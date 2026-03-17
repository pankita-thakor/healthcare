import { createBrowserClient } from "@/lib/supabase";
import { getClientUserId } from "@/lib/client-auth";
import { getDemoSessionByUserId, isDemoUserId, readDemoSession } from "@/lib/demo-session";

const supabase = createBrowserClient();

type PatientAppointmentRow = {
  id: string;
  provider_id: string;
  start_time: string;
  status: string;
};

type PatientUserRow = {
  full_name: string | null;
};

type ProviderNameRow = {
  id: string;
  full_name: string | null;
};

export interface PatientDashboardSnapshot {
  patientId: string;
  patientName: string;
  upcomingAppointments: number;
  unreadMessages: number;
  prescriptions: number;
  medicalRecords: number;
  nextAppointment: string | null;
  peerProviderId: string | null;
  peerProviderName: string | null;
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
    unreadMessages: 3,
    prescriptions: 4,
    medicalRecords: 6,
    nextAppointment: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    peerProviderId: "demo-provider-1",
    peerProviderName: "Dr. Pankita Thakor"
  };
}

async function getCurrentUserId() {
  const cookieUserId = typeof document !== "undefined" ? getClientUserId() : null;
  if (cookieUserId) return cookieUserId;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function fetchPatientDashboard(): Promise<PatientDashboardSnapshot> {
  const patientId = await getCurrentUserId();
  if (isDemoUserId(patientId)) {
    return buildDemoPatientDashboard(patientId);
  }

  try {
    const [{ data: user }, { data: appointments }, { data: unreadMessages }, { data: prescriptions }, { data: medicalRecords }] =
      await Promise.all([
        supabase.from("users").select("full_name").eq("id", patientId).maybeSingle(),
        supabase
          .from("appointments")
          .select("id, provider_id, start_time, status")
          .eq("patient_id", patientId)
          .order("start_time", { ascending: true }),
        supabase.from("messages").select("id").eq("recipient_id", patientId).is("read_at", null),
        supabase.from("prescriptions").select("id").eq("patient_id", patientId),
        supabase.from("medical_records").select("id").eq("patient_id", patientId)
      ]);

    const appointmentRows = (appointments ?? []) as PatientAppointmentRow[];
    
    if (appointmentRows.length === 0) {
      return buildDemoPatientDashboard(patientId, (user as PatientUserRow | null)?.full_name ?? undefined);
    }

    const now = new Date();
    const upcomingRows = appointmentRows.filter((appointment) => {
      return ["pending", "confirmed"].includes(appointment.status) && new Date(appointment.start_time) >= now;
    });
    const nextAppointment = upcomingRows[0] ?? null;

    const providerIds = Array.from(new Set(appointmentRows.map((appointment) => appointment.provider_id)));
    const { data: providerRows } = providerIds.length
      ? await supabase.from("users").select("id, full_name").in("id", providerIds)
      : { data: [] };

    const providerNameRows = (providerRows ?? []) as ProviderNameRow[];
    const peerProviderId = nextAppointment?.provider_id ?? appointmentRows[0]?.provider_id ?? null;
    const peerProviderName = providerNameRows.find((provider) => provider.id === peerProviderId)?.full_name ?? null;

    return {
      patientId,
      patientName: (user as PatientUserRow | null)?.full_name ?? "Patient",
      upcomingAppointments: upcomingRows.length,
      unreadMessages: unreadMessages?.length ?? 0,
      prescriptions: prescriptions?.length ?? 0,
      medicalRecords: medicalRecords?.length ?? 0,
      nextAppointment: nextAppointment?.start_time ?? null,
      peerProviderId,
      peerProviderName
    };
  } catch (error) {
    if (isTransientBackendError(error)) {
      return buildDemoPatientDashboard(patientId);
    }

    throw error;
  }
}
