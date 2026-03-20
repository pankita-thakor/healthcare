import { createBrowserClient } from "@/lib/supabase";
import { safeGetUser } from "@/lib/supabase-auth";
import { getClientUserId } from "@/lib/client-auth";
import { logActivity } from "@/services/activity/service";

const supabase = createBrowserClient();

export interface ProviderAvailabilitySlot {
  id: string;
  available_date: string;
  start_time: string;
  end_time: string;
}

/** @deprecated Use ProviderAvailabilitySlot - kept for backwards compatibility */
export interface ProviderAvailability {
  available_date: string;
  start_time: string;
  end_time: string;
}

async function getCurrentUserId() {
  const cookieUserId = typeof document !== "undefined" ? getClientUserId() : null;
  if (cookieUserId) return cookieUserId;

  const { user } = await safeGetUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * Fetches all availability slots for the current provider (stacked, non-overlapping).
 */
export async function fetchProviderAvailability(): Promise<ProviderAvailabilitySlot[]> {
  const providerId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("provider_availability")
    .select("id, available_date, start_time, end_time")
    .eq("provider_id", providerId)
    .order("available_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching availability:", error);
    throw error;
  }
  return (data ?? []) as ProviderAvailabilitySlot[];
}

/**
 * Adds a new availability slot.
 */
export async function setProviderAvailability(input: {
  date: string;
  startTime: string;
  endTime: string;
}) {
  const providerId = await getCurrentUserId();
  const { error } = await supabase.from("provider_availability").insert({
    provider_id: providerId,
    available_date: input.date,
    start_time: input.startTime,
    end_time: input.endTime
  });

  if (error) {
    console.error("Error setting availability:", error);
    throw error;
  }
  logActivity("Set Availability", `Added slot for ${input.date}`, "availability");
}

/**
 * Updates an existing availability slot by id.
 */
export async function updateProviderAvailabilitySlot(
  slotId: string,
  input: { date: string; startTime: string; endTime: string }
) {
  const providerId = await getCurrentUserId();
  const { error } = await supabase
    .from("provider_availability")
    .update({
      available_date: input.date,
      start_time: input.startTime,
      end_time: input.endTime
    })
    .eq("id", slotId)
    .eq("provider_id", providerId);

  if (error) {
    console.error("Error updating availability slot:", error);
    throw error;
  }
  logActivity("Updated Availability", `Edited slot for ${input.date}`, "availability");
}

/**
 * Deletes a single availability slot by id.
 */
export async function deleteProviderAvailabilitySlot(slotId: string) {
  const providerId = await getCurrentUserId();
  const { error } = await supabase
    .from("provider_availability")
    .delete()
    .eq("id", slotId)
    .eq("provider_id", providerId);

  if (error) {
    console.error("Error deleting availability slot:", error);
    throw error;
  }
  logActivity("Deleted Availability", "Removed slot", "availability");
}

/**
 * @deprecated Use deleteProviderAvailabilitySlot - deletes all slots for provider
 */
export async function deleteProviderAvailability() {
  const providerId = await getCurrentUserId();
  const { error } = await supabase
    .from("provider_availability")
    .delete()
    .eq("provider_id", providerId);

  if (error) {
    console.error("Error deleting availability:", error);
    throw error;
  }
  logActivity("Cleared Availability", "Removed all availability", "availability");
}

export interface ProviderWeekAppointment {
  id: string;
  patient_id: string;
  patient_name?: string | null;
  start_time: string;
  end_time: string;
  status: string;
  reason: string | null;
  reschedule_reason: string | null;
}

/**
 * Fetches provider appointments for a date range (week).
 */
export async function fetchProviderWeekAppointments(
  weekStart: Date
): Promise<ProviderWeekAppointment[]> {
  const providerId = await getCurrentUserId();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: appointments, error: apptError } = await supabase
    .from("appointments")
    .select("id, patient_id, start_time, end_time, status, reason, reschedule_reason")
    .eq("provider_id", providerId)
    .in("status", ["pending", "confirmed", "completed"])
    .gte("start_time", weekStart.toISOString())
    .lte("start_time", weekEnd.toISOString())
    .order("start_time", { ascending: true });

  if (apptError) return [];

  const patientIds = [...new Set((appointments ?? []).map((a) => a.patient_id))];
  if (patientIds.length === 0) return (appointments ?? []) as ProviderWeekAppointment[];

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", patientIds);

  const nameMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

  return (appointments ?? []).map((a) => ({
    id: a.id,
    patient_id: a.patient_id,
    patient_name: nameMap.get(a.patient_id) ?? null,
    start_time: a.start_time,
    end_time: a.end_time,
    status: a.status,
    reason: a.reason,
    reschedule_reason: (a as { reschedule_reason?: string | null }).reschedule_reason ?? null,
  })) as ProviderWeekAppointment[];
}

/**
 * Reschedule an appointment (provider only). Updates start/end time and sets reschedule_reason.
 * Creates a notification for the patient.
 */
export async function rescheduleAppointment(input: {
  appointmentId: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
}) {
  const providerId = await getCurrentUserId();
  const { data: existing, error: fetchErr } = await supabase
    .from("appointments")
    .select("id, patient_id, provider_id")
    .eq("id", input.appointmentId)
    .eq("provider_id", providerId)
    .single();

  if (fetchErr || !existing) throw new Error("Appointment not found or access denied");

  const { error: updateErr } = await supabase
    .from("appointments")
    .update({
      start_time: input.newStartTime,
      end_time: input.newEndTime,
      reschedule_reason: input.reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.appointmentId)
    .eq("provider_id", providerId);

  if (updateErr) throw updateErr;

  // Patient notification is sent by DB trigger notify_on_appointment_rescheduled (RLS blocks client insert for other users)

  logActivity("Rescheduled Appointment", `${input.appointmentId}`, "appointment");
}

/**
 * Mark an appointment as completed (provider only).
 */
export async function markAppointmentComplete(appointmentId: string) {
  const providerId = await getCurrentUserId();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("provider_id", providerId);

  if (error) throw error;
  logActivity("Completed Appointment", appointmentId, "appointment");
}

// --- Provider Dashboard & Patient Directory ---

export interface ProviderDashboardSnapshot {
  providerName: string;
  todayAppointments: number;
  queueCount: number;
  priorityPatients: number;
  completionRate: number;
  appointmentStatus: Array<{ name: string; value: number }>;
  upcomingSchedule: Array<{ label: string; appointments: number }>;
  patientPriorityMix: Array<{ name: string; value: number }>;
  monthlyConsultations: Array<{ label: string; consultations: number }>;
  vitals: Array<{
    recorded_at: string;
    heart_rate: number | null;
    systolic_bp: number | null;
    diastolic_bp: number | null;
    weight: number | null;
    glucose: number | null;
  }>;
  topConditions: Array<{ label: string; patients: number }>;
  unreadMessages: number;
}

export async function fetchProviderDashboard(): Promise<ProviderDashboardSnapshot> {
  const providerId = await getCurrentUserId();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { data: user },
    { data: allAppointments },
    { data: messages }
  ] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", providerId).maybeSingle(),
    supabase
      .from("appointments")
      .select("id, patient_id, start_time, status")
      .eq("provider_id", providerId)
      .gte("start_time", new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("messages").select("id").eq("recipient_id", providerId).is("read_at", null)
  ]);

  const appointments = (allAppointments ?? []) as Array<{ id: string; patient_id: string; start_time: string; status: string }>;
  const providerPatientIds = [...new Set(appointments.map((a) => a.patient_id).filter(Boolean))];
  const { data: patientRows } = providerPatientIds.length > 0
    ? await supabase.from("patients").select("user_id, condition_summary, priority").in("user_id", providerPatientIds)
    : { data: [] };
  const todayCount = appointments.filter(
    (a) => new Date(a.start_time) >= todayStart && new Date(a.start_time) <= todayEnd
  ).length;
  const queueCount = appointments.filter((a) =>
    ["pending", "confirmed"].includes(a.status) && new Date(a.start_time) >= now
  ).length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const total = appointments.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statusCounts: Record<string, number> = {};
  for (const a of appointments) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }
  const appointmentStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const weekLabels: string[] = [];
  const weekCounts: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = appointments.filter(
      (a) =>
        new Date(a.start_time) >= d &&
        new Date(a.start_time) < next &&
        ["pending", "confirmed"].includes(a.status)
    ).length;
    weekLabels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    weekCounts.push(count);
  }
  const upcomingSchedule = weekLabels.map((label, i) => ({ label, appointments: weekCounts[i] ?? 0 }));

  const priorityCounts: Record<string, number> = {};
  for (const p of patientRows ?? []) {
    const pri = (p as { priority?: string }).priority ?? "normal";
    priorityCounts[pri] = (priorityCounts[pri] ?? 0) + 1;
  }
  const patientPriorityMix = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

  const monthLabels: string[] = [];
  const monthCounts: number[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (5 - i));
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    const count = appointments.filter(
      (a) => new Date(a.start_time) >= d && new Date(a.start_time) < next
    ).length;
    monthLabels.push(d.toLocaleDateString("en-US", { month: "short" }));
    monthCounts.push(count);
  }
  const monthlyConsultations = monthLabels.map((label, i) => ({ label, consultations: monthCounts[i] ?? 0 }));

  const conditionCounts: Record<string, number> = {};
  for (const p of patientRows ?? []) {
    const cond = (p as { condition_summary?: string }).condition_summary ?? "General";
    const key = cond || "General";
    conditionCounts[key] = (conditionCounts[key] ?? 0) + 1;
  }
  const topConditions = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, patients]) => ({ label, patients }));

  let vitals: ProviderDashboardSnapshot["vitals"] = [];
  if (providerPatientIds.length > 0) {
    const { data: vs } = await supabase
      .from("vital_signs")
      .select("recorded_at, heart_rate, systolic_bp, diastolic_bp, weight, glucose")
      .in("patient_id", providerPatientIds)
      .order("recorded_at", { ascending: false })
      .limit(30);
    vitals = (vs ?? []) as ProviderDashboardSnapshot["vitals"];
  }

  const priorityPatients = (patientRows ?? []).filter(
    (p) => ((p as { priority?: string }).priority ?? "").toLowerCase() === "high"
  ).length;

  return {
    providerName: (user as { full_name?: string } | null)?.full_name ?? "Doctor",
    todayAppointments: todayCount,
    queueCount,
    priorityPatients,
    completionRate,
    appointmentStatus,
    upcomingSchedule,
    patientPriorityMix,
    monthlyConsultations,
    vitals,
    topConditions,
    unreadMessages: messages?.length ?? 0
  };
}

export interface ProviderPatientListItem {
  id: string;
  name: string;
  age: number | null;
  condition: string | null;
  priority: string;
  last_visit: string | null;
  next_appointment: string | null;
}

export async function fetchProviderPatients(): Promise<ProviderPatientListItem[]> {
  const providerId = await getCurrentUserId();

  const { data: patientUsers, error: usersErr } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("role", "patient");

  if (usersErr || !patientUsers?.length) return [];

  const userIds = patientUsers.map((u) => u.id);

  const [
    { data: patientProfiles },
    { data: appointments }
  ] = await Promise.all([
    supabase.from("patients").select("user_id, date_of_birth, condition_summary, priority").in("user_id", userIds),
    supabase
      .from("appointments")
      .select("patient_id, start_time, status")
      .eq("provider_id", providerId)
      .order("start_time", { ascending: false })
  ]);

  const profileMap = new Map(
    (patientProfiles ?? []).map((p) => [
      (p as { user_id: string }).user_id,
      p as { date_of_birth?: string; condition_summary?: string; priority?: string }
    ])
  );

  const appts = (appointments ?? []) as Array<{ patient_id: string; start_time: string; status: string }>;
  const now = new Date();
  const lastByPatient = new Map<string, string>();
  const nextByPatient = new Map<string, string>();
  for (const a of appts) {
    const t = new Date(a.start_time);
    if (t <= now && !lastByPatient.has(a.patient_id)) {
      lastByPatient.set(a.patient_id, a.start_time);
    }
    if (t > now && ["pending", "confirmed"].includes(a.status)) {
      nextByPatient.set(a.patient_id, a.start_time);
    }
  }

  const result: ProviderPatientListItem[] = [];
  for (const u of patientUsers) {
    const profile = profileMap.get(u.id);
    const dob = profile?.date_of_birth;
    let age: number | null = null;
    if (dob) {
      const birth = new Date(dob);
      age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }
    result.push({
      id: u.id,
      name: (u as { full_name?: string }).full_name ?? "Patient",
      age,
      condition: profile?.condition_summary ?? null,
      priority: profile?.priority ?? "normal",
      last_visit: lastByPatient.get(u.id) ?? null,
      next_appointment: nextByPatient.get(u.id) ?? null
    });
  }

  return result;
}

// --- Provider Patient Profile (detail view) ---

export interface ProviderPatientProfile {
  name: string;
  age: number | null;
  phone: string | null;
  gender: string | null;
  bloodGroup: string | null;
  insurance: string | null;
  summary: string;
  medicalHistory: string | null;
  vitals: Array<{
    recorded_at: string;
    heart_rate: number | null;
    systolic_bp: number | null;
    diastolic_bp: number | null;
    weight: number | null;
    glucose: number | null;
  }>;
  documents: Array<{ id: string; title: string; file_path: string; uploaded_at: string }>;
  consultations: Array<{ id: string; start_time: string; end_time: string; status: string; reason: string | null }>;
  soapNotes: Array<{
    id: string;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    updated_at: string;
  }>;
}

export async function fetchProviderPatientProfile(patientId: string): Promise<ProviderPatientProfile> {
  const providerId = await getCurrentUserId();

  const [
    { data: user },
    { data: patient },
    { data: vitals },
    { data: documents },
    { data: appointments },
    { data: soapNotes },
    { data: medicalRecords }
  ] = await Promise.all([
    supabase.from("users").select("full_name, phone").eq("id", patientId).maybeSingle(),
    supabase.from("patients").select("date_of_birth, blood_group, condition_summary, gender, insurance").eq("user_id", patientId).maybeSingle(),
    supabase
      .from("vital_signs")
      .select("recorded_at, heart_rate, systolic_bp, diastolic_bp, weight, glucose")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
      .limit(50),
    supabase
      .from("medical_documents")
      .select("id, title, file_path, uploaded_at")
      .eq("patient_id", patientId)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, start_time, end_time, status, reason")
      .eq("patient_id", patientId)
      .eq("provider_id", providerId)
      .order("start_time", { ascending: false }),
    supabase
      .from("clinical_notes")
      .select("id, subjective, objective, assessment, plan, updated_at")
      .eq("patient_id", patientId)
      .eq("provider_id", providerId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("medical_records")
      .select("diagnosis, treatment_plan, record_date")
      .eq("patient_id", patientId)
      .order("record_date", { ascending: false })
  ]);

  const u = user as { full_name?: string; phone?: string } | null;
  const p = patient as { date_of_birth?: string; blood_group?: string; condition_summary?: string; gender?: string; insurance?: string } | null;

  let age: number | null = null;
  if (p?.date_of_birth) {
    const birth = new Date(p.date_of_birth);
    age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  const records = (medicalRecords ?? []) as Array<{ diagnosis?: string; treatment_plan?: string; record_date: string }>;
  const medicalHistory = records
    .map((r) => {
      const parts = [r.diagnosis, r.treatment_plan].filter(Boolean);
      return parts.length ? `${new Date(r.record_date).toLocaleDateString()}: ${parts.join(" – ")}` : null;
    })
    .filter(Boolean)
    .join("\n\n") || null;

  const notes = (soapNotes ?? []) as Array<{
    id: string;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    updated_at: string;
  }>;

  return {
    name: u?.full_name ?? "Patient",
    age,
    phone: u?.phone ?? null,
    gender: p?.gender ?? null,
    bloodGroup: p?.blood_group ?? null,
    insurance: p?.insurance ?? null,
    summary: p?.condition_summary ?? "No condition summary recorded.",
    medicalHistory,
    vitals: (vitals ?? []) as ProviderPatientProfile["vitals"],
    documents: (documents ?? []).map((d) => ({
      id: (d as { id: string }).id,
      title: (d as { title: string }).title,
      file_path: (d as { file_path: string }).file_path,
      uploaded_at: (d as { uploaded_at: string }).uploaded_at
    })),
    consultations: (appointments ?? []).map((a) => ({
      id: (a as { id: string }).id,
      start_time: (a as { start_time: string }).start_time,
      end_time: (a as { end_time?: string }).end_time ?? (a as { start_time: string }).start_time,
      status: (a as { status: string }).status,
      reason: (a as { reason?: string | null }).reason ?? null
    })),
    soapNotes: notes.map((n) => ({
      id: n.id,
      subjective: n.subjective ?? null,
      objective: n.objective ?? null,
      assessment: n.assessment ?? null,
      plan: n.plan ?? null,
      updated_at: n.updated_at
    }))
  };
}
