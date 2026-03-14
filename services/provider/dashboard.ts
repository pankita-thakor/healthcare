import { createBrowserClient } from "@/lib/supabase";
import { getClientUserId } from "@/lib/client-auth";
import { getDemoSessionByUserId, isDemoUserId, readDemoSession, writeDemoSession } from "@/lib/demo-session";
import { readSyncedProviderSlots, upsertSyncedProviderSlot } from "@/lib/slot-sync";

const supabase = createBrowserClient();
const QUERY_TIMEOUT_MS = 8000;
const DEMO_PROVIDER_PROFILE_KEY = "hf_demo_provider_profile";
const DEMO_BOOKINGS_KEY = "hf_demo_bookings";

export interface ProviderCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface ProviderDashboardSnapshot {
  providerName: string;
  categoryName: string;
  todayAppointments: number;
  priorityPatients: number;
  queueCount: number;
  unreadMessages: number;
  reportsCount: number;
  appointmentStatus: Array<{ name: string; value: number }>;
  upcomingSchedule: Array<{ label: string; appointments: number }>;
  vitals: Array<{
    recorded_at: string;
    heart_rate: number | null;
    systolic_bp: number | null;
    diastolic_bp: number | null;
    weight: number | null;
    glucose: number | null;
  }>;
}

export interface ProviderPatientListItem {
  id: string;
  name: string;
  age: number | null;
  last_visit: string | null;
  condition: string | null;
  priority: string;
  next_appointment: string | null;
}

export interface ProviderPatientProfile {
  id: string;
  name: string;
  age: number | null;
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
  documents: Array<{ id: string; title: string; uploaded_at: string; file_path: string }>;
  consultations: Array<{ id: string; start_time: string; status: string; reason: string | null }>;
}

export interface ProviderAppointment {
  id: string;
  patient_id: string;
  patient_name?: string | null;
  start_time: string;
  end_time: string;
  status: string;
  reason: string | null;
  meeting_url: string | null;
}

export interface ProviderAvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ProviderProfileDetails {
  name: string;
  phone: string;
  licenseNumber: string;
  categoryId: string;
  experience: string;
  hospital: string;
  bio: string;
  availability: string;
}

type ProviderDashboardRow = { user_id: string; category_id: string | null };
type ProviderUserRow = { full_name: string | null };
type ProviderAppointmentRow = { id?: string; patient_id: string; start_time: string; status: string };
type ProviderPriorityRow = { user_id: string; priority: string | null };
type ProviderCategoryRow = { name: string | null };
type ProviderVitalRow = {
  recorded_at: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  weight: number | null;
  glucose: number | null;
};
type ProviderPatientRow = {
  user_id: string;
  date_of_birth: string | null;
  medical_history: string | null;
  condition_summary: string | null;
  priority: string | null;
};
type ProviderUserNameRow = { id: string; full_name: string | null };
type ProviderAppointmentNameRow = { id: string; full_name: string | null };
type ProviderAvailabilityPayload = {
  notes?: string | null;
  slots?: Array<{
    id?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active?: boolean;
  }>;
} | null;

function isTransientBackendError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Unexpected token '<'") ||
    message.includes("is not valid JSON") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError")
  );
}

function readDemoProviderProfile(): ProviderProfileDetails {
  const demoSession = getDemoSessionByUserId("demo-provider-1") ?? readDemoSession();

  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(DEMO_PROVIDER_PROFILE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ProviderProfileDetails;
        return {
          ...parsed,
          name: demoSession?.fullName ?? parsed.name,
          phone: demoSession?.phone ?? parsed.phone
        };
      } catch {
        localStorage.removeItem(DEMO_PROVIDER_PROFILE_KEY);
      }
    }
  }

  return {
    name: demoSession?.fullName ?? "Dr. Pankita Thakor",
    phone: demoSession?.phone ?? "+91 99887 76655",
    licenseNumber: "MED-2026-7781",
    categoryId: "demo-cardiology",
    experience: "8",
    hospital: "Healthyfy Care Center",
    bio: "Experienced physician supporting virtual follow-ups and preventive care planning.",
    availability: "Mon to Sat, 10:00 AM to 6:00 PM"
  };
}

function writeDemoProviderProfile(profile: ProviderProfileDetails) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEMO_PROVIDER_PROFILE_KEY, JSON.stringify(profile));
  }
}

function buildDemoProviderDashboard(): ProviderDashboardSnapshot {
  const demoProfile = readDemoProviderProfile();
  const today = new Date();

  return {
    providerName: demoProfile.name,
    categoryName: demoProfile.categoryId === "demo-cardiology" ? "Cardiology" : "General Medicine",
    todayAppointments: 6,
    priorityPatients: 3,
    queueCount: 4,
    unreadMessages: 5,
    reportsCount: 12,
    appointmentStatus: [
      { name: "Pending", value: 3 },
      { name: "Confirmed", value: 8 },
      { name: "Completed", value: 14 },
      { name: "Cancelled", value: 1 }
    ],
    upcomingSchedule: Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() + index);
      return {
        label: day.toLocaleDateString([], { weekday: "short" }),
        appointments: [4, 6, 5, 7, 3, 4, 2][index] ?? 0
      };
    }),
    vitals: [
      { recorded_at: new Date(today.getTime() - 86400000 * 4).toISOString(), heart_rate: 76, systolic_bp: 118, diastolic_bp: 78, weight: 68, glucose: 96 },
      { recorded_at: new Date(today.getTime() - 86400000 * 3).toISOString(), heart_rate: 82, systolic_bp: 124, diastolic_bp: 80, weight: 71, glucose: 101 },
      { recorded_at: new Date(today.getTime() - 86400000 * 2).toISOString(), heart_rate: 79, systolic_bp: 120, diastolic_bp: 77, weight: 69, glucose: 98 },
      { recorded_at: new Date(today.getTime() - 86400000).toISOString(), heart_rate: 88, systolic_bp: 128, diastolic_bp: 84, weight: 74, glucose: 109 },
      { recorded_at: today.toISOString(), heart_rate: 74, systolic_bp: 116, diastolic_bp: 76, weight: 67, glucose: 93 }
    ]
  };
}

function buildDemoProviderPatients(): ProviderPatientListItem[] {
  const now = Date.now();

  return [
    {
      id: "demo-patient-1",
      name: "Jhanvi Patel",
      age: 29,
      last_visit: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      condition: "Routine follow-up",
      priority: "medium",
      next_appointment: new Date(now + 1000 * 60 * 60 * 24).toISOString()
    },
    {
      id: "demo-patient-2",
      name: "Rahul Mehta",
      age: 41,
      last_visit: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
      condition: "Hypertension support",
      priority: "high",
      next_appointment: new Date(now + 1000 * 60 * 60 * 30).toISOString()
    }
  ];
}

function readDemoBookings() {
  if (typeof localStorage === "undefined") return [];

  const raw = localStorage.getItem(DEMO_BOOKINGS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Array<{
      id: string;
      patient_id: string;
      provider_id: string;
      start_time: string;
      end_time: string;
      status: string;
      reason: string | null;
    }>;
  } catch {
    localStorage.removeItem(DEMO_BOOKINGS_KEY);
    return [];
  }
}

function buildDemoProviderAppointments(providerId: string): ProviderAppointment[] {
  const patients = new Map(buildDemoProviderPatients().map((patient) => [patient.id, patient.name]));
  const demoAppointments = readDemoBookings()
    .filter((booking) => booking.provider_id === providerId)
    .map((booking) => ({
      id: booking.id,
      patient_id: booking.patient_id,
      patient_name: patients.get(booking.patient_id) ?? "Patient",
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status,
      reason: booking.reason,
      meeting_url: null
    }));

  if (demoAppointments.length) {
    return demoAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  const now = Date.now();
  return [
    {
      id: "demo-provider-appointment-1",
      patient_id: "demo-patient-1",
      patient_name: "Jhanvi Patel",
      start_time: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
      end_time: new Date(now + 1000 * 60 * 90 * 24 / 24).toISOString(),
      status: "confirmed",
      reason: "Follow-up consultation",
      meeting_url: null
    },
    {
      id: "demo-provider-appointment-2",
      patient_id: "demo-patient-2",
      patient_name: "Rahul Mehta",
      start_time: new Date(now + 1000 * 60 * 60 * 48).toISOString(),
      end_time: new Date(now + 1000 * 60 * 90 + 1000 * 60 * 60 * 48).toISOString(),
      status: "pending",
      reason: "Blood pressure review",
      meeting_url: null
    }
  ].sort((a, b) => a.start_time.localeCompare(b.start_time));
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

function withTimeout<T>(promise: PromiseLike<T>, label: string, timeoutMs = QUERY_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out`));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function normalizeAvailabilitySlots(payload: ProviderAvailabilityPayload): ProviderAvailabilitySlot[] {
  return (payload?.slots ?? []).map((slot, index) => ({
    id: slot.id ?? `${slot.day_of_week}-${slot.start_time}-${slot.end_time}-${index}`,
    day_of_week: slot.day_of_week,
    start_time: slot.start_time,
    end_time: slot.end_time,
    is_active: slot.is_active ?? true
  }));
}

async function fetchProviderAvailabilityPayload(providerId: string): Promise<ProviderAvailabilityPayload> {
  const { data } = await supabase
    .from("providers")
    .select("availability")
    .eq("user_id", providerId)
    .maybeSingle();

  return (data?.availability ?? null) as ProviderAvailabilityPayload;
}

async function saveProviderAvailabilityPayload(
  providerId: string,
  updater: (current: ProviderAvailabilityPayload) => ProviderAvailabilityPayload
) {
  const current = await fetchProviderAvailabilityPayload(providerId);
  const next = updater(current);

  const { error } = await supabase
    .from("providers")
    .update({ availability: next })
    .eq("user_id", providerId);

  if (error) throw error;
}

export async function fetchProviderCategories(): Promise<ProviderCategory[]> {
  try {
    const { data, error } = await supabase.from("provider_categories").select("id, name, description").order("name");
    if (error) throw error;
    return (data ?? []) as ProviderCategory[];
  } catch (error) {
    if (isTransientBackendError(error)) {
      return [
        { id: "demo-cardiology", name: "Cardiology", description: "Heart and vascular care" },
        { id: "demo-general", name: "General Medicine", description: "Primary and preventive care" }
      ];
    }

    throw error;
  }
}

export async function fetchProviderProfileDetails(): Promise<ProviderProfileDetails> {
  const providerId = await getCurrentUserId();
  if (isDemoUserId(providerId)) {
    return readDemoProviderProfile();
  }

  try {
    const [{ data: user }, { data: provider }] = await Promise.all([
      supabase.from("users").select("full_name, phone").eq("id", providerId).single(),
      supabase
        .from("providers")
        .select("license_number, category_id, experience, hospital, bio, availability")
        .eq("user_id", providerId)
        .single()
    ]);

    return {
      name: user?.full_name ?? "",
      phone: user?.phone ?? "",
      licenseNumber: provider?.license_number ?? "",
      categoryId: provider?.category_id ?? "",
      experience: provider?.experience != null ? String(provider.experience) : "",
      hospital: provider?.hospital ?? "",
      bio: provider?.bio ?? "",
      availability: provider?.availability?.notes ?? ""
    };
  } catch (error) {
    if (isTransientBackendError(error)) {
      return readDemoProviderProfile();
    }

    throw error;
  }
}

export async function saveProviderProfileDetails(input: ProviderProfileDetails) {
  const providerId = await getCurrentUserId();
  if (isDemoUserId(providerId)) {
    writeDemoProviderProfile(input);
    const currentDemoSession = getDemoSessionByUserId(providerId);
    if (currentDemoSession) {
      writeDemoSession({
        ...currentDemoSession,
        fullName: input.name,
        phone: input.phone
      });
    }
    return;
  }

  let specializationName: string | null = null;
  const currentAvailability = await fetchProviderAvailabilityPayload(providerId);

  if (input.categoryId) {
    const { data: category } = await supabase
      .from("provider_categories")
      .select("name")
      .eq("id", input.categoryId)
      .single();
    specializationName = category?.name ?? null;
  }

  const { error: userError } = await supabase.from("users").upsert(
    {
      id: providerId,
      full_name: input.name,
      phone: input.phone,
      role: "provider",
      status: "pending_approval"
    },
    { onConflict: "id" }
  );

  if (userError) throw userError;

  const { error: providerError } = await supabase.from("providers").upsert(
    {
      user_id: providerId,
      phone: input.phone,
      license_number: input.licenseNumber,
      category_id: input.categoryId,
      specialization: specializationName,
      experience: input.experience ? Number(input.experience) : null,
      hospital: input.hospital,
      bio: input.bio,
      availability: { notes: input.availability, slots: currentAvailability?.slots ?? [] },
      onboarding_completed: true
    },
    { onConflict: "user_id" }
  );

  if (providerError) throw providerError;
}

export async function fetchProviderDashboard(): Promise<ProviderDashboardSnapshot> {
  const providerId = await getCurrentUserId();
  if (isDemoUserId(providerId)) {
    return buildDemoProviderDashboard();
  }

  const [providerRow, userRow, appointments, docs, msgRows] = await Promise.all([
    withTimeout(
      Promise.resolve(supabase
        .from("providers")
        .select("user_id, category_id")
        .eq("user_id", providerId)
        .maybeSingle()),
      "provider profile"
    ).then((result) => (result.data ?? null) as ProviderDashboardRow | null).catch(() => null),
    withTimeout(
      Promise.resolve(supabase.from("users").select("full_name").eq("id", providerId).maybeSingle()),
      "provider user profile"
    ).then((result) => (result.data ?? null) as ProviderUserRow | null).catch(() => null),
    withTimeout(
      Promise.resolve(supabase
        .from("appointments")
        .select("id, patient_id, start_time, status")
        .eq("provider_id", providerId)
        .order("start_time", { ascending: false })),
      "provider appointments"
    ).then((result) => (result.data ?? []) as ProviderAppointmentRow[]).catch(() => []),
    withTimeout(
      Promise.resolve(supabase
        .from("medical_documents")
        .select("id")
        .eq("provider_id", providerId)),
      "provider documents"
    ).then((result) => result.data ?? []).catch(() => []),
    withTimeout(
      Promise.resolve(supabase
        .from("messages")
        .select("id")
        .eq("recipient_id", providerId)
        .is("read_at", null)),
      "provider messages"
    ).then((result) => result.data ?? []).catch(() => [])
  ]);

  const appointmentPatientIds = Array.from(new Set(appointments.map((a) => a.patient_id)));

  const [patientRows, categoryRow] = await Promise.all([
    appointmentPatientIds.length
      ? withTimeout(
          Promise.resolve(supabase.from("patients").select("user_id, priority").in("user_id", appointmentPatientIds)),
          "provider patient priorities"
        ).then((result) => (result.data ?? []) as ProviderPriorityRow[]).catch(() => [])
      : Promise.resolve([] as ProviderPriorityRow[]),
    providerRow?.category_id
      ? withTimeout(
          Promise.resolve(supabase.from("provider_categories").select("name").eq("id", providerRow.category_id).maybeSingle()),
          "provider category"
        ).then((result) => (result.data ?? null) as ProviderCategoryRow | null).catch(() => null)
      : Promise.resolve(null as ProviderCategoryRow | null)
  ]);

  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((a) => a.start_time.slice(0, 10) === todayDate).length;

  const priorityPatients = patientRows.filter(
    (p) => p.priority?.toLowerCase() === "high"
  ).length;

  const queueCount = appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length;
  const appointmentStatus = [
    { name: "Pending", value: appointments.filter((a) => a.status === "pending").length },
    { name: "Confirmed", value: appointments.filter((a) => a.status === "confirmed").length },
    { name: "Completed", value: appointments.filter((a) => a.status === "completed").length },
    { name: "Cancelled", value: appointments.filter((a) => a.status === "cancelled").length }
  ];

  const upcomingSchedule = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + index);
    const dayKey = day.toISOString().slice(0, 10);

    return {
      label: day.toLocaleDateString([], { weekday: "short" }),
      appointments: appointments.filter((appointment) => appointment.start_time.slice(0, 10) === dayKey).length
    };
  });

  const vitals = await withTimeout(
    Promise.resolve(supabase
      .from("vital_signs")
      .select("recorded_at, heart_rate, systolic_bp, diastolic_bp, weight, glucose")
      .eq("provider_id", providerId)
      .order("recorded_at", { ascending: false })
      .limit(12)),
    "provider vitals"
  ).then((result) => (result.data ?? []) as ProviderVitalRow[]).catch(() => []);

  return {
    providerName: userRow?.full_name ?? "Doctor",
    categoryName: categoryRow?.name ?? "General",
    todayAppointments,
    priorityPatients,
    queueCount,
    unreadMessages: msgRows.length,
    reportsCount: docs.length,
    appointmentStatus,
    upcomingSchedule,
    vitals: vitals.reverse()
  };
}

export async function fetchProviderPatients(): Promise<ProviderPatientListItem[]> {
  const providerId = await getCurrentUserId();
  if (isDemoUserId(providerId)) {
    return buildDemoProviderPatients();
  }

  const appointments = await withTimeout(
    Promise.resolve(supabase
      .from("appointments")
      .select("patient_id, start_time, status")
      .eq("provider_id", providerId)
      .order("start_time", { ascending: false })),
    "provider patient appointments"
  ).then((result) => (result.data ?? []) as ProviderAppointmentRow[]).catch(() => []);

  const patientIds = Array.from(new Set(appointments.map((a) => a.patient_id)));
  if (!patientIds.length) return [];

  const [patients, users] = await Promise.all([
    withTimeout(
      Promise.resolve(supabase
        .from("patients")
        .select("user_id, date_of_birth, medical_history, condition_summary, priority")
        .in("user_id", patientIds)),
      "provider patient details"
    ).then((result) => (result.data ?? []) as ProviderPatientRow[]).catch(() => []),
    withTimeout(
      Promise.resolve(supabase.from("users").select("id, full_name").in("id", patientIds)),
      "provider patient names"
    ).then((result) => (result.data ?? []) as ProviderUserNameRow[]).catch(() => [])
  ]);

  return patientIds.map((id) => {
    const p = patients.find((row) => row.user_id === id);
    const u = users.find((row) => row.id === id);
    const patientAppointments = appointments.filter((a) => a.patient_id === id);
    const lastVisit = patientAppointments.find((a) => a.status === "completed")?.start_time ?? null;
    const nextVisit = [...patientAppointments].reverse().find((a) => ["pending", "confirmed"].includes(a.status))?.start_time ?? null;

    const age = p?.date_of_birth
      ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return {
      id,
      name: u?.full_name ?? "Unknown",
      age,
      last_visit: lastVisit,
      condition: p?.condition_summary ?? null,
      priority: p?.priority ?? "normal",
      next_appointment: nextVisit
    };
  });
}

export async function fetchProviderPatientProfile(patientId: string): Promise<ProviderPatientProfile> {
  const [{ data: user }, { data: patient }, { data: vitals }, { data: docs }, { data: visits }] = await Promise.all([
    supabase.from("users").select("id, full_name").eq("id", patientId).single(),
    supabase
      .from("patients")
      .select("user_id, date_of_birth, medical_history, condition_summary")
      .eq("user_id", patientId)
      .single(),
    supabase
      .from("vital_signs")
      .select("recorded_at, heart_rate, systolic_bp, diastolic_bp, weight, glucose")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: true })
      .limit(30),
    supabase
      .from("medical_documents")
      .select("id, title, uploaded_at, file_path")
      .eq("patient_id", patientId)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, start_time, status, reason")
      .eq("patient_id", patientId)
      .order("start_time", { ascending: false })
      .limit(20)
  ]);

  const age = patient?.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return {
    id: patientId,
    name: user?.full_name ?? "Patient",
    age,
    summary: patient?.condition_summary ?? "No summary available.",
    medicalHistory: patient?.medical_history ?? null,
    vitals: (vitals ?? []) as ProviderPatientProfile["vitals"],
    documents: (docs ?? []) as ProviderPatientProfile["documents"],
    consultations: (visits ?? []) as ProviderPatientProfile["consultations"]
  };
}

export async function fetchProviderAppointments(): Promise<ProviderAppointment[]> {
  const providerId = await getCurrentUserId();
  if (isDemoUserId(providerId)) {
    return buildDemoProviderAppointments(providerId);
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, start_time, end_time, status, reason, meeting_url")
    .eq("provider_id", providerId)
    .order("start_time", { ascending: true });

  if (error) throw error;

  const appointments = (data ?? []) as ProviderAppointment[];
  const patientIds = Array.from(new Set(appointments.map((appointment) => appointment.patient_id)));
  const { data: patientUsers, error: patientUsersError } = patientIds.length
    ? await supabase.from("users").select("id, full_name").in("id", patientIds)
    : { data: [], error: null };

  if (patientUsersError) throw patientUsersError;

  const patientNameMap = new Map(
    ((patientUsers ?? []) as ProviderAppointmentNameRow[]).map((patient) => [patient.id, patient.full_name ?? "Patient"])
  );

  return appointments.map((appointment) => ({
    ...appointment,
    patient_name: patientNameMap.get(appointment.patient_id) ?? "Patient"
  }));
}

export async function saveAvailability(input: { dayOfWeek: number; startTime: string; endTime: string }) {
  const providerId = await getCurrentUserId();
  const [{ data: user }, { data: provider }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", providerId).maybeSingle(),
    supabase.from("providers").select("specialization").eq("user_id", providerId).maybeSingle()
  ]);

  await saveProviderAvailabilityPayload(providerId, (current) => {
    const existingSlots = normalizeAvailabilitySlots(current);
    const deduped = existingSlots.filter((slot) => {
      return !(
        slot.day_of_week === input.dayOfWeek &&
        slot.start_time === input.startTime &&
        slot.end_time === input.endTime
      );
    });

    deduped.push({
      id: `${input.dayOfWeek}-${input.startTime}-${input.endTime}`,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      is_active: true
    });

    deduped.sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    });

    return {
      notes: current?.notes ?? "",
      slots: deduped
    };
  });

  upsertSyncedProviderSlot({
    provider_id: providerId,
    provider_name: user?.full_name ?? "Provider",
    category_name: provider?.specialization ?? null,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    is_active: true
  });

  const { error } = await supabase.rpc("save_provider_availability", {
    p_day_of_week: input.dayOfWeek,
    p_start_time: input.startTime,
    p_end_time: input.endTime
  });

  if (
    error &&
    !error.message.toLowerCase().includes("save_provider_availability") &&
    !error.message.toLowerCase().includes("function")
  ) {
    throw error;
  }
}

export async function fetchAvailability() {
  const providerId = await getCurrentUserId();
  const localSlots = readSyncedProviderSlots()
    .filter((slot) => slot.provider_id === providerId)
    .map((slot, index) => ({
      id: `${slot.provider_id}-${slot.day_of_week}-${slot.start_time}-${slot.end_time}-${index}`,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_active: slot.is_active
    }));

  const { data, error } = await supabase.rpc("fetch_provider_availability");
  if (!error) {
    const merged = [...((data ?? []) as ProviderAvailabilitySlot[]), ...localSlots];
    const deduped = new Map<string, ProviderAvailabilitySlot>();
    for (const slot of merged) {
      deduped.set(`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`, slot);
    }
    return Array.from(deduped.values()).sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    });
  }

  const fallback = await fetchProviderAvailabilityPayload(providerId);
  const merged = [...normalizeAvailabilitySlots(fallback), ...localSlots];
  const deduped = new Map<string, ProviderAvailabilitySlot>();
  for (const slot of merged) {
    deduped.set(`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`, slot);
  }
  return Array.from(deduped.values()).sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });
}

export async function rescheduleAppointment(appointmentId: string, nextStartISO: string, nextEndISO: string) {
  if (typeof localStorage !== "undefined") {
    const demoBookings = readDemoBookings();
    const match = demoBookings.find((booking) => booking.id === appointmentId);
    if (match) {
      const updated = demoBookings.map((booking) =>
        booking.id === appointmentId
          ? { ...booking, start_time: nextStartISO, end_time: nextEndISO, status: "confirmed" }
          : booking
      );
      localStorage.setItem(DEMO_BOOKINGS_KEY, JSON.stringify(updated));
      return;
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update({ start_time: nextStartISO, end_time: nextEndISO, status: "confirmed" })
    .eq("id", appointmentId);

  if (error) throw error;
}

export async function ensureConsultationRoom(appointmentId: string): Promise<{ meetingUrl: string }> {
  const { data: existing, error } = await supabase
    .from("appointments")
    .select("id, meeting_url")
    .eq("id", appointmentId)
    .single();

  if (error) throw error;
  if (existing.meeting_url) return { meetingUrl: existing.meeting_url };

  const response = await fetch("/api/video/room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingName: `consult-${appointmentId}` })
  });

  if (!response.ok) throw new Error("Failed to create meeting room");
  const room = await response.json();

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ meeting_url: room.url })
    .eq("id", appointmentId);

  if (updateError) throw updateError;
  return { meetingUrl: room.url as string };
}

export async function saveSoapNote(input: {
  appointmentId: string;
  patientId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}) {
  const providerId = await getCurrentUserId();

  const { error } = await supabase.from("clinical_notes").insert({
    appointment_id: input.appointmentId,
    patient_id: input.patientId,
    provider_id: providerId,
    subjective: input.subjective,
    objective: input.objective,
    assessment: input.assessment,
    plan: input.plan
  });

  if (error) throw error;
}

export async function getAppointmentById(appointmentId: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, provider_id, start_time, status, meeting_url")
    .eq("id", appointmentId)
    .single();
  if (error) throw error;
  return data;
}

export async function getOrCreateConversation(patientId: string, appointmentId?: string | null) {
  const providerId = await getCurrentUserId();

  let query = supabase
    .from("conversations")
    .select("id")
    .eq("provider_id", providerId)
    .eq("patient_id", patientId)
    .limit(1);

  if (appointmentId) query = query.eq("appointment_id", appointmentId);

  const { data } = await query;
  if (data?.[0]?.id) return data[0].id as string;

  const { data: inserted, error } = await supabase
    .from("conversations")
    .insert({ provider_id: providerId, patient_id: patientId, appointment_id: appointmentId ?? null })
    .select("id")
    .single();

  if (error) throw error;
  return inserted.id as string;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, content, created_at, conversation_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function sendConversationMessage(input: {
  conversationId: string;
  recipientId: string;
  content: string;
}) {
  const senderId = await getCurrentUserId();
  const { error } = await supabase.from("messages").insert({
    sender_id: senderId,
    recipient_id: input.recipientId,
    conversation_id: input.conversationId,
    content: input.content
  });
  if (error) throw error;
}

export function subscribeConversation(conversationId: string, onInsert: (payload: any) => void) {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      onInsert
    )
    .subscribe();
}
