import { createBrowserClient } from "@/lib/supabase";
import { getClientUserId } from "@/lib/client-auth";
import { getDemoSessionByUserId, isDemoUserId, readDemoSession, writeDemoSession } from "@/lib/demo-session";
import { readSyncedProviderSlots, removeSyncedProviderSlot, upsertSyncedProviderSlot } from "@/lib/slot-sync";
import { logActivity } from "@/services/activity/service";

const supabase = createBrowserClient();
const QUERY_TIMEOUT_MS = 8000;
const DEMO_PROVIDER_PROFILE_KEY = "hf_demo_provider_profile";
const DEMO_BOOKINGS_KEY = "hf_demo_bookings";
const DEMO_SOAP_NOTES_KEY = "hf_demo_soap_notes";
const DEMO_MESSAGES_KEY = "hf_demo_messages";
const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export interface ProviderCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface ProviderDashboardSnapshot {
  providerName: string;
  categoryName: string;
  todayAppointments: number;
  totalPatients: number;
  priorityPatients: number;
  queueCount: number;
  followUpsDue: number;
  completionRate: number;
  unreadMessages: number;
  reportsCount: number;
  appointmentStatus: Array<{ name: string; value: number }>;
  upcomingSchedule: Array<{ label: string; appointments: number }>;
  patientPriorityMix: Array<{ name: string; value: number }>;
  monthlyConsultations: Array<{ label: string; consultations: number }>;
  topConditions: Array<{ label: string; patients: number }>;
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
  soapNotes: SoapNoteRecord[];
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
  /** When set, slot applies only on this date (YYYY-MM-DD). When absent, slot is recurring by day_of_week. */
  specific_date?: string;
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

export interface SoapNoteRecord {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  provider_id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

type ProviderDashboardRow = { user_id: string; category_id: string | null };
type ProviderUserRow = { full_name: string | null };
type ProviderAppointmentRow = { id?: string; patient_id: string; start_time: string; status: string };
type ProviderPriorityRow = { user_id: string; priority: string | null; condition_summary?: string | null };
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
    specific_date?: string;
  }>;
} | null;

function isTransientBackendError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Unexpected token '<'") ||
    message.includes("is not valid JSON") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("Could not find the function") ||
    message.includes("schema cache") ||
    message.includes("fetch_provider_availability") ||
    message.includes("save_provider_availability") ||
    message.includes("PGRST202")
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

const DEFAULT_DEMO_PROVIDER_PATIENTS: ProviderPatientListItem[] = [
  {
    id: "demo-patient-1",
    name: "Jhanvi Patel",
    age: 29,
    last_visit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    condition: "Routine follow-up",
    priority: "medium",
    next_appointment: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: "demo-patient-2",
    name: "Rahul Mehta",
    age: 41,
    last_visit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    condition: "Hypertension support",
    priority: "high",
    next_appointment: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString()
  },
  {
    id: "demo-patient-3",
    name: "Nisha Shah",
    age: 35,
    last_visit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    condition: "Cardiac risk screening",
    priority: "normal",
    next_appointment: new Date(Date.now() + 1000 * 60 * 60 * 54).toISOString()
  },
  {
    id: "demo-patient-4",
    name: "Karan Joshi",
    age: 52,
    last_visit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    condition: "Medication adjustment",
    priority: "high",
    next_appointment: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString()
  },
  {
    id: "demo-patient-5",
    name: "Meera Iyer",
    age: 47,
    last_visit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
    condition: "Post-operative follow-up",
    priority: "medium",
    next_appointment: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString()
  },
  {
    id: "demo-patient-6",
    name: "Arjun Desai",
    age: 61,
    last_visit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    condition: "Diabetes and BP review",
    priority: "normal",
    next_appointment: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString()
  }
];

function buildDefaultDemoProviderAppointments(): ProviderAppointment[] {
  const now = Date.now();
  return [
    {
      id: "demo-provider-appointment-1",
      patient_id: "demo-patient-1",
      patient_name: "Jhanvi Patel",
      start_time: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
      end_time: new Date(now + 1000 * 60 * 90 + 1000 * 60 * 60 * 24).toISOString(),
      status: "confirmed",
      reason: "Routine follow-up consultation",
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
    },
    {
      id: "demo-provider-appointment-3",
      patient_id: "demo-patient-3",
      patient_name: "Nisha Shah",
      start_time: new Date(now + 1000 * 60 * 60 * 72).toISOString(),
      end_time: new Date(now + 1000 * 60 * 90 + 1000 * 60 * 60 * 72).toISOString(),
      status: "confirmed",
      reason: "Preventive cardiac screening",
      meeting_url: null
    },
    {
      id: "demo-provider-appointment-4",
      patient_id: "demo-patient-4",
      patient_name: "Karan Joshi",
      start_time: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      end_time: new Date(now - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 30).toISOString(),
      status: "completed",
      reason: "Medication titration review",
      meeting_url: null
    },
    {
      id: "demo-provider-appointment-5",
      patient_id: "demo-patient-5",
      patient_name: "Meera Iyer",
      start_time: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
      end_time: new Date(now - 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 30).toISOString(),
      status: "completed",
      reason: "Recovery follow-up",
      meeting_url: null
    },
    {
      id: "demo-provider-appointment-6",
      patient_id: "demo-patient-6",
      patient_name: "Arjun Desai",
      start_time: new Date(now + 1000 * 60 * 60 * 144).toISOString(),
      end_time: new Date(now + 1000 * 60 * 90 + 1000 * 60 * 60 * 144).toISOString(),
      status: "confirmed",
      reason: "Diabetes and hypertension review",
      meeting_url: null
    }
  ].sort((a, b) => a.start_time.localeCompare(b.start_time));
}

function buildDemoPatientProfile(patientId: string): ProviderPatientProfile {
  const patient = DEFAULT_DEMO_PROVIDER_PATIENTS.find((item) => item.id === patientId);
  const appointments = buildDefaultDemoProviderAppointments()
    .filter((appointment) => appointment.patient_id === patientId)
    .map((appointment) => ({
      id: appointment.id,
      start_time: appointment.start_time,
      status: appointment.status,
      reason: appointment.reason
    }));

  const profiles: Record<string, Omit<ProviderPatientProfile, "id" | "name" | "age" | "consultations" | "soapNotes">> = {
    "demo-patient-1": {
      summary: "Recovering well after last tele-consultation with improved lifestyle adherence.",
      medicalHistory: "Mild palpitations, vitamin D deficiency, family history of hypertension.",
      vitals: [
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(), heart_rate: 82, systolic_bp: 122, diastolic_bp: 81, weight: 63, glucose: 95 },
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), heart_rate: 78, systolic_bp: 118, diastolic_bp: 79, weight: 62, glucose: 92 },
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), heart_rate: 75, systolic_bp: 117, diastolic_bp: 77, weight: 62, glucose: 91 }
      ],
      documents: [
        { id: "demo-doc-1", title: "CBC and thyroid panel", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), file_path: "/demo/cbc-thyroid.pdf" },
        { id: "demo-doc-2", title: "ECG summary", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), file_path: "/demo/ecg-summary.pdf" }
      ]
    },
    "demo-patient-2": {
      summary: "Needs tighter BP monitoring with evening medication adherence.",
      medicalHistory: "Stage 1 hypertension, borderline cholesterol, sedentary routine.",
      vitals: [
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(), heart_rate: 88, systolic_bp: 138, diastolic_bp: 90, weight: 79, glucose: 105 },
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), heart_rate: 84, systolic_bp: 134, diastolic_bp: 88, weight: 78, glucose: 102 },
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), heart_rate: 80, systolic_bp: 129, diastolic_bp: 84, weight: 77, glucose: 99 }
      ],
      documents: [
        { id: "demo-doc-3", title: "Ambulatory BP report", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(), file_path: "/demo/bp-report.pdf" }
      ]
    },
    "demo-patient-3": {
      summary: "Preventive screening case with no acute symptoms and positive lifestyle changes.",
      medicalHistory: "Family history of CAD, occasional migraines.",
      vitals: [
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), heart_rate: 76, systolic_bp: 116, diastolic_bp: 76, weight: 58, glucose: 90 },
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), heart_rate: 73, systolic_bp: 114, diastolic_bp: 75, weight: 58, glucose: 89 }
      ],
      documents: [
        { id: "demo-doc-4", title: "Lipid profile", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), file_path: "/demo/lipid-profile.pdf" }
      ]
    },
    "demo-patient-4": {
      summary: "Recent medication changes need monitoring for tolerance and response.",
      medicalHistory: "Longstanding hypertension, sleep disturbance.",
      vitals: [
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), heart_rate: 90, systolic_bp: 142, diastolic_bp: 92, weight: 82, glucose: 110 },
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), heart_rate: 84, systolic_bp: 132, diastolic_bp: 86, weight: 81, glucose: 104 }
      ],
      documents: [
        { id: "demo-doc-5", title: "Medication adherence notes", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), file_path: "/demo/medication-notes.pdf" }
      ]
    },
    "demo-patient-5": {
      summary: "Recovering steadily with no red-flag symptoms after discharge.",
      medicalHistory: "Post-operative review, iron supplementation.",
      vitals: [
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), heart_rate: 79, systolic_bp: 120, diastolic_bp: 80, weight: 66, glucose: 96 }
      ],
      documents: [
        { id: "demo-doc-6", title: "Discharge summary", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(), file_path: "/demo/discharge-summary.pdf" }
      ]
    },
    "demo-patient-6": {
      summary: "Metabolic review patient with improving glucose control.",
      medicalHistory: "Type 2 diabetes, hypertension, dietary counseling in progress.",
      vitals: [
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(), heart_rate: 86, systolic_bp: 130, diastolic_bp: 84, weight: 84, glucose: 138 },
        { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), heart_rate: 82, systolic_bp: 126, diastolic_bp: 82, weight: 83, glucose: 126 }
      ],
      documents: [
        { id: "demo-doc-7", title: "HbA1c trend report", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), file_path: "/demo/hba1c-report.pdf" }
      ]
    }
  };

  const fallback = profiles[patientId] ?? profiles["demo-patient-1"];

  return {
    id: patientId,
    name: patient?.name ?? "Patient",
    age: patient?.age ?? null,
    summary: fallback.summary,
    medicalHistory: fallback.medicalHistory,
    vitals: fallback.vitals,
    documents: fallback.documents,
    consultations: appointments,
    soapNotes: readDemoSoapNotes().filter(n => n.patient_id === patientId).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  };
}

function buildDefaultDemoSoapNotes(): SoapNoteRecord[] {
  const now = new Date();
  return [
    {
      id: "demo-soap-seed-1",
      appointment_id: "demo-provider-appointment-4",
      patient_id: "demo-patient-4",
      provider_id: "demo-provider-1",
      subjective: "Patient reports improved sleep and fewer dizziness episodes after medication adjustment.",
      objective: "Home BP log trending down; no acute distress during video follow-up.",
      assessment: "Responding to dose adjustment with partial BP improvement.",
      plan: "Continue current medication for 2 weeks, maintain BP diary, repeat follow-up next week.",
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 30).toISOString(),
      updated_at: new Date(now.getTime() - 1000 * 60 * 60 * 26).toISOString()
    },
    {
      id: "demo-soap-seed-2",
      appointment_id: "demo-provider-appointment-5",
      patient_id: "demo-patient-5",
      provider_id: "demo-provider-1",
      subjective: "Patient feels stronger, walking daily, mild soreness only with exertion.",
      objective: "Incision recovery discussed from discharge notes; no fever or swelling reported.",
      assessment: "Post-operative recovery progressing as expected.",
      plan: "Continue wound care, hydration, and repeat CBC if fatigue worsens.",
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 54).toISOString(),
      updated_at: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString()
    }
  ];
}

function buildDefaultDemoMessages(): DemoMessageRecord[] {
  const now = Date.now();
  return [
    {
      id: "demo-message-1",
      sender_id: "demo-provider-1",
      recipient_id: "demo-patient-1",
      conversation_id: "demo-conversation-demo-provider-appointment-1",
      content: "Please upload your latest ECG before tomorrow's review.",
      created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString()
    },
    {
      id: "demo-message-2",
      sender_id: "demo-patient-1",
      recipient_id: "demo-provider-1",
      conversation_id: "demo-conversation-demo-provider-appointment-1",
      content: "Sure doctor, I have uploaded it and noted the symptoms from this week.",
      created_at: new Date(now - 1000 * 60 * 60 * 7).toISOString()
    },
    {
      id: "demo-message-3",
      sender_id: "demo-provider-1",
      recipient_id: "demo-patient-2",
      conversation_id: "demo-conversation-demo-provider-appointment-2",
      content: "Keep checking your evening blood pressure and avoid skipping your dose tonight.",
      created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString()
    },
    {
      id: "demo-message-4",
      sender_id: "demo-patient-2",
      recipient_id: "demo-provider-1",
      conversation_id: "demo-conversation-demo-provider-appointment-2",
      content: "Understood. I will send today's readings before the consultation.",
      created_at: new Date(now - 1000 * 60 * 60 * 4).toISOString()
    }
  ];
}

function buildDemoProviderDashboard(name?: string): ProviderDashboardSnapshot {
  const demoProfile = readDemoProviderProfile();
  const today = new Date();

  return {
    providerName: name ?? demoProfile.name,
    categoryName: demoProfile.categoryId === "demo-cardiology" ? "Cardiology" : "General Medicine",
    todayAppointments: 6,
    totalPatients: 24,
    priorityPatients: 3,
    queueCount: 4,
    followUpsDue: 7,
    completionRate: 82,
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
    patientPriorityMix: [
      { name: "High", value: 3 },
      { name: "Medium", value: 7 },
      { name: "Normal", value: 14 }
    ],
    monthlyConsultations: [
      { label: "Oct", consultations: 18 },
      { label: "Nov", consultations: 22 },
      { label: "Dec", consultations: 19 },
      { label: "Jan", consultations: 27 },
      { label: "Feb", consultations: 24 },
      { label: "Mar", consultations: 31 }
    ],
    topConditions: [
      { label: "Hypertension follow-up", patients: 8 },
      { label: "Post-consultation review", patients: 6 },
      { label: "Cardiac risk screening", patients: 5 },
      { label: "Medication adjustment", patients: 4 }
    ],
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
  return DEFAULT_DEMO_PROVIDER_PATIENTS;
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
  const localBookings = readDemoBookings().filter((booking) => booking.provider_id === providerId);
  const defaults = buildDefaultDemoProviderAppointments();

  // Create a map of final appointments, letting local overrides take precedence
  const appointmentMap = new Map<string, ProviderAppointment>();

  // Add defaults first
  for (const appt of defaults) {
    appointmentMap.set(appt.id, appt);
  }

  // Overwrite with or add local bookings
  for (const booking of localBookings) {
    appointmentMap.set(booking.id, {
      id: booking.id,
      patient_id: booking.patient_id,
      patient_name: patients.get(booking.patient_id) ?? "Patient",
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status,
      reason: booking.reason,
      meeting_url: null
    });
  }

  return Array.from(appointmentMap.values()).sort((a, b) => a.start_time.localeCompare(b.start_time));
}

function readDemoSoapNotes(): SoapNoteRecord[] {
  if (typeof localStorage === "undefined") return [];

  const raw = localStorage.getItem(DEMO_SOAP_NOTES_KEY);
  if (!raw) return buildDefaultDemoSoapNotes();

  try {
    return JSON.parse(raw) as SoapNoteRecord[];
  } catch {
    localStorage.removeItem(DEMO_SOAP_NOTES_KEY);
    return [];
  }
}

function writeDemoSoapNotes(notes: SoapNoteRecord[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEMO_SOAP_NOTES_KEY, JSON.stringify(notes));
}

type DemoMessageRecord = {
  id: string;
  sender_id: string;
  recipient_id: string;
  conversation_id: string;
  content: string;
  created_at: string;
};

function readDemoMessages(): DemoMessageRecord[] {
  if (typeof localStorage === "undefined") return [];

  const raw = localStorage.getItem(DEMO_MESSAGES_KEY);
  if (!raw) return buildDefaultDemoMessages();

  try {
    return JSON.parse(raw) as DemoMessageRecord[];
  } catch {
    localStorage.removeItem(DEMO_MESSAGES_KEY);
    return [];
  }
}

function writeDemoMessages(messages: DemoMessageRecord[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(messages));
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
  return (payload?.slots ?? []).map((slot, index) => {
    const slotKey = slot.specific_date
      ? `${slot.specific_date}-${slot.start_time}-${slot.end_time}`
      : `${slot.day_of_week}-${slot.start_time}-${slot.end_time}`;
    return {
      id: slot.id ?? `${slotKey}-${index}`,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_active: slot.is_active ?? true,
      specific_date: slot.specific_date
    };
  });
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
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();

    const [{ data: user }, { data: provider }] = await Promise.all([
      supabase.from("users").select("full_name, phone").eq("id", providerId).maybeSingle(),
      supabase
        .from("providers")
        .select("license_number, category_id, experience, hospital, bio, availability")
        .eq("user_id", providerId)
        .maybeSingle()
    ]);

    return {
      name: user?.full_name ?? (authUser?.user_metadata?.full_name as string | undefined) ?? "",
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
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

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
      email: authUser?.email ?? "",
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

  if (appointments.length === 0) {
    return buildDemoProviderDashboard(userRow?.full_name ?? undefined);
  }

  const [patientRows, categoryRow] = await Promise.all([
    appointmentPatientIds.length
      ? withTimeout(
          Promise.resolve(supabase.from("patients").select("user_id, priority, condition_summary").in("user_id", appointmentPatientIds)),
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
  const nowMs = today.getTime();
  const todayAppointments = appointments.filter((a) => a.start_time.slice(0, 10) === todayDate).length;
  const totalPatients = appointmentPatientIds.length;

  const priorityPatients = patientRows.filter(
    (p) => p.priority?.toLowerCase() === "high"
  ).length;

  const queueCount = appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length;
  const followUpsDue = appointments.filter((appointment) => {
    if (!["pending", "confirmed"].includes(appointment.status)) return false;
    const startMs = new Date(appointment.start_time).getTime();
    const diffMs = startMs - nowMs;
    return diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24 * 3;
  }).length;
  const completedAppointments = appointments.filter((a) => a.status === "completed").length;
  const completionRate = appointments.length ? Math.round((completedAppointments / appointments.length) * 100) : 0;
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

  const patientPriorityMix = [
    { name: "High", value: patientRows.filter((row) => row.priority?.toLowerCase() === "high").length },
    { name: "Medium", value: patientRows.filter((row) => row.priority?.toLowerCase() === "medium").length },
    { name: "Normal", value: patientRows.filter((row) => !row.priority || row.priority.toLowerCase() === "normal").length }
  ];

  const monthlyConsultations = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: monthDate.toLocaleDateString([], { month: "short" }),
      consultations: appointments.filter((appointment) => appointment.start_time.slice(0, 7) === monthKey).length
    };
  });

  const topConditions = Object.entries(
    patientRows.reduce<Record<string, number>>((acc, row) => {
      const label = row.condition_summary?.trim() || "General follow-up";
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, patients]) => ({ label, patients }));

  const vitalsResult = await withTimeout(
    Promise.resolve(supabase
      .from("vital_signs")
      .select("recorded_at, heart_rate, systolic_bp, diastolic_bp, weight, glucose")
      .eq("provider_id", providerId)
      .order("recorded_at", { ascending: false })
      .limit(12)),
    "provider vitals"
  ).then((result) => (result.data ?? []) as ProviderVitalRow[]).catch(() => []);

  let vitals = vitalsResult;
  if (vitals.length === 0) {
    vitals = [
      { recorded_at: new Date(today.getTime() - 86400000 * 4).toISOString(), heart_rate: 76, systolic_bp: 118, diastolic_bp: 78, weight: 68, glucose: 96 },
      { recorded_at: new Date(today.getTime() - 86400000 * 3).toISOString(), heart_rate: 82, systolic_bp: 124, diastolic_bp: 80, weight: 71, glucose: 101 },
      { recorded_at: new Date(today.getTime() - 86400000 * 2).toISOString(), heart_rate: 79, systolic_bp: 120, diastolic_bp: 77, weight: 69, glucose: 98 },
      { recorded_at: new Date(today.getTime() - 86400000).toISOString(), heart_rate: 88, systolic_bp: 128, diastolic_bp: 84, weight: 74, glucose: 109 },
      { recorded_at: today.toISOString(), heart_rate: 74, systolic_bp: 116, diastolic_bp: 76, weight: 67, glucose: 93 }
    ];
  }

  return {
    providerName: userRow?.full_name ?? "Doctor",
    categoryName: categoryRow?.name ?? "General",
    todayAppointments,
    totalPatients,
    priorityPatients,
    queueCount,
    followUpsDue,
    completionRate,
    unreadMessages: msgRows.length,
    reportsCount: docs.length || 12, // Dummy count
    appointmentStatus,
    upcomingSchedule,
    patientPriorityMix,
    monthlyConsultations,
    topConditions: topConditions.length ? topConditions : [
      { label: "Hypertension follow-up", patients: 8 },
      { label: "Post-consultation review", patients: 6 },
      { label: "Cardiac risk screening", patients: 5 },
      { label: "Medication adjustment", patients: 4 }
    ],
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

  if (appointments.length === 0) {
    return buildDemoProviderPatients();
  }

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
  if (patientId.startsWith("demo-")) {
    return buildDemoPatientProfile(patientId);
  }

  const [{ data: user }, { data: patient }, { data: vitals }, { data: docs }, { data: visits }, soapNotes] = await Promise.all([
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
      .limit(20),
    fetchPatientSoapNotes(patientId)
  ]);

  const age = patient?.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  let finalVitals = (vitals ?? []) as ProviderPatientProfile["vitals"];
  if (finalVitals.length === 0) {
    finalVitals = [
      { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(), heart_rate: 82, systolic_bp: 122, diastolic_bp: 81, weight: 63, glucose: 95 },
      { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), heart_rate: 78, systolic_bp: 118, diastolic_bp: 79, weight: 62, glucose: 92 },
      { recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), heart_rate: 75, systolic_bp: 117, diastolic_bp: 77, weight: 62, glucose: 91 }
    ];
  }

  let finalDocs = (docs ?? []) as ProviderPatientProfile["documents"];
  if (finalDocs.length === 0) {
    finalDocs = [
      { id: "demo-doc-1", title: "CBC and thyroid panel", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), file_path: "/demo/cbc-thyroid.pdf" },
      { id: "demo-doc-2", title: "ECG summary", uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), file_path: "/demo/ecg-summary.pdf" }
    ];
  }

  return {
    id: patientId,
    name: user?.full_name ?? "Patient",
    age,
    summary: patient?.condition_summary ?? "Recovering well after last tele-consultation with improved lifestyle adherence.",
    medicalHistory: patient?.medical_history ?? "Mild palpitations, vitamin D deficiency, family history of hypertension.",
    vitals: finalVitals,
    documents: finalDocs,
    consultations: (visits ?? []) as ProviderPatientProfile["consultations"],
    soapNotes
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

  if (appointments.length === 0) {
    return buildDemoProviderAppointments(providerId);
  }

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

export async function saveAvailability(input: {
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
}) {
  const providerId = await getCurrentUserId();
  let providerName = "Provider";
  let categoryName: string | null = null;

  const useDate = !!input.specificDate;
  const dayOfWeek = useDate
    ? new Date(input.specificDate!).getDay()
    : (input.dayOfWeek ?? 0);
  const slotPayload = {
    id: useDate
      ? `${input.specificDate}-${input.startTime}-${input.endTime}`
      : `${dayOfWeek}-${input.startTime}-${input.endTime}`,
    day_of_week: dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    is_active: true as const,
    ...(useDate && { specific_date: input.specificDate })
  };

  try {
    const [{ data: user }, { data: provider }] = await Promise.all([
      supabase.from("users").select("full_name").eq("id", providerId).maybeSingle(),
      supabase.from("providers").select("specialization").eq("user_id", providerId).maybeSingle()
    ]);

    providerName = user?.full_name ?? providerName;
    categoryName = provider?.specialization ?? categoryName;
  } catch (error) {
    if (!isTransientBackendError(error)) throw error;
  }

  try {
    await saveProviderAvailabilityPayload(providerId, (current) => {
      const existingSlots = normalizeAvailabilitySlots(current);
      const deduped = existingSlots.filter((slot) => {
        if (useDate) {
          return !(
            slot.specific_date === input.specificDate &&
            slot.start_time === input.startTime &&
            slot.end_time === input.endTime
          );
        }
        return !(
          !slot.specific_date &&
          slot.day_of_week === dayOfWeek &&
          slot.start_time === input.startTime &&
          slot.end_time === input.endTime
        );
      });

      deduped.push(slotPayload);

      deduped.sort((a, b) => {
        const aKey = a.specific_date ?? String(a.day_of_week);
        const bKey = b.specific_date ?? String(b.day_of_week);
        if (aKey !== bKey) return aKey.localeCompare(bKey);
        return a.start_time.localeCompare(b.start_time);
      });

      return {
        notes: current?.notes ?? "",
        slots: deduped
      };
    });
  } catch (error) {
    if (!isTransientBackendError(error)) throw error;
  }

  upsertSyncedProviderSlot({
    provider_id: providerId,
    provider_name: providerName,
    category_name: categoryName,
    day_of_week: dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    is_active: true,
    ...(useDate && { specific_date: input.specificDate })
  });

  const label = useDate
    ? new Date(input.specificDate!).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : (WEEKDAY_LABELS[dayOfWeek] ?? "selected day");
  logActivity("Updated Availability", `Saved new slot for ${label} at ${input.startTime}`, "availability");
}

export async function updateAvailability(input: {
  originalDayOfWeek?: number;
  originalSpecificDate?: string;
  originalStartTime: string;
  originalEndTime: string;
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
}) {
  const providerId = await getCurrentUserId();
  const useDate = !!input.specificDate;
  const dayOfWeek = useDate
    ? new Date(input.specificDate!).getDay()
    : (input.dayOfWeek ?? 0);
  const slotPayload = {
    id: useDate
      ? `${input.specificDate}-${input.startTime}-${input.endTime}`
      : `${dayOfWeek}-${input.startTime}-${input.endTime}`,
    day_of_week: dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    is_active: true as const,
    ...(useDate && { specific_date: input.specificDate })
  };

  try {
    await saveProviderAvailabilityPayload(providerId, (current) => {
      const nextSlots = normalizeAvailabilitySlots(current).filter((slot) => {
        const origUseDate = !!input.originalSpecificDate;
        if (origUseDate) {
          return !(
            slot.specific_date === input.originalSpecificDate &&
            slot.start_time === input.originalStartTime &&
            slot.end_time === input.originalEndTime
          );
        }
        return !(
          !slot.specific_date &&
          slot.day_of_week === (input.originalDayOfWeek ?? 0) &&
          slot.start_time === input.originalStartTime &&
          slot.end_time === input.originalEndTime
        );
      });

      nextSlots.push(slotPayload);

      nextSlots.sort((a, b) => {
        const aKey = a.specific_date ?? String(a.day_of_week);
        const bKey = b.specific_date ?? String(b.day_of_week);
        if (aKey !== bKey) return aKey.localeCompare(bKey);
        return a.start_time.localeCompare(b.start_time);
      });

      return {
        notes: current?.notes ?? "",
        slots: nextSlots
      };
    });
  } catch (error) {
    if (!isTransientBackendError(error)) throw error;
  }

  removeSyncedProviderSlot({
    provider_id: providerId,
    day_of_week: input.originalDayOfWeek ?? 0,
    start_time: input.originalStartTime,
    end_time: input.originalEndTime,
    ...(input.originalSpecificDate && { specific_date: input.originalSpecificDate })
  });

  upsertSyncedProviderSlot({
    provider_id: providerId,
    provider_name: null,
    category_name: null,
    day_of_week: dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    is_active: true,
    ...(useDate && { specific_date: input.specificDate })
  });

  const label = useDate
    ? new Date(input.specificDate!).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : (WEEKDAY_LABELS[dayOfWeek] ?? "selected day");
  logActivity("Updated Availability", `Adjusted slot to ${label} at ${input.startTime}`, "availability");
}

export async function deleteAvailability(input: {
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
}) {
  const providerId = await getCurrentUserId();
  const useDate = !!input.specificDate;
  const dayOfWeek = input.dayOfWeek ?? 0;

  try {
    await saveProviderAvailabilityPayload(providerId, (current) => {
      const nextSlots = normalizeAvailabilitySlots(current).filter((slot) => {
        if (useDate) {
          return !(
            slot.specific_date === input.specificDate &&
            slot.start_time === input.startTime &&
            slot.end_time === input.endTime
          );
        }
        return !(
          !slot.specific_date &&
          slot.day_of_week === dayOfWeek &&
          slot.start_time === input.startTime &&
          slot.end_time === input.endTime
        );
      });

      return {
        notes: current?.notes ?? "",
        slots: nextSlots
      };
    });
  } catch (error) {
    if (!isTransientBackendError(error)) throw error;
  }

  removeSyncedProviderSlot({
    provider_id: providerId,
    day_of_week: dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    ...(useDate && { specific_date: input.specificDate })
  });

  const label = useDate
    ? new Date(input.specificDate!).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : (WEEKDAY_LABELS[dayOfWeek] ?? "selected day");
  logActivity("Updated Availability", `Removed slot for ${label} at ${input.startTime}`, "availability");
}

function slotDedupKey(slot: ProviderAvailabilitySlot) {
  const datePart = slot.specific_date ?? String(slot.day_of_week);
  return `${datePart}-${slot.start_time}-${slot.end_time}`;
}

export async function fetchAvailability() {
  const providerId = await getCurrentUserId();
  const localSlots = readSyncedProviderSlots()
    .filter((slot) => slot.provider_id === providerId)
    .map((slot, index) => {
      const slotKey = slot.specific_date
        ? `${slot.specific_date}-${slot.start_time}-${slot.end_time}`
        : `${slot.day_of_week}-${slot.start_time}-${slot.end_time}`;
      return {
        id: `${slot.provider_id}-${slotKey}-${index}`,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_active: slot.is_active,
        ...(slot.specific_date && { specific_date: slot.specific_date })
      };
    });

  try {
    const fallback = await fetchProviderAvailabilityPayload(providerId);
    const merged = [...normalizeAvailabilitySlots(fallback), ...localSlots];
    const deduped = new Map<string, ProviderAvailabilitySlot>();
    for (const slot of merged) {
      deduped.set(slotDedupKey(slot), slot);
    }
    return Array.from(deduped.values()).sort((a, b) => {
      const aKey = a.specific_date ?? String(a.day_of_week);
      const bKey = b.specific_date ?? String(b.day_of_week);
      if (aKey !== bKey) return aKey.localeCompare(bKey);
      return a.start_time.localeCompare(b.start_time);
    });
  } catch (error) {
    if (!isTransientBackendError(error)) {
      throw error;
    }
  }

  return localSlots.sort((a, b) => {
    const aKey = a.specific_date ?? String(a.day_of_week);
    const bKey = b.specific_date ?? String(b.day_of_week);
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return a.start_time.localeCompare(b.start_time);
  });
}

export async function rescheduleAppointment(appointmentId: string, nextStartISO: string, nextEndISO: string) {
  const providerId = await getCurrentUserId();

  if (appointmentId.startsWith("demo-")) {
    if (typeof localStorage !== "undefined") {
      const demoBookings = readDemoBookings();
      const match = demoBookings.find((booking) => booking.id === appointmentId);
      
      const updated = match 
        ? demoBookings.map((booking) =>
            booking.id === appointmentId
              ? { ...booking, start_time: nextStartISO, end_time: nextEndISO, status: "confirmed" }
              : booking
          )
        : [...demoBookings, { 
            id: appointmentId, 
            start_time: nextStartISO, 
            end_time: nextEndISO, 
            status: "confirmed",
            patient_id: "demo-patient-1", // fallback patient
            provider_id: providerId,
            reason: "Rescheduled demo appointment"
          }];

      localStorage.setItem(DEMO_BOOKINGS_KEY, JSON.stringify(updated));
      logActivity("Rescheduled Appointment", `Moved appointment to ${new Date(nextStartISO).toLocaleString()}`, "appointment");
    }
    return;
  }

  const { error } = await supabase
    .from("appointments")
    .update({ start_time: nextStartISO, end_time: nextEndISO, status: "confirmed" })
    .eq("id", appointmentId);

  if (error) throw error;
  logActivity("Rescheduled Appointment", `Moved appointment to ${new Date(nextStartISO).toLocaleString()}`, "appointment");
}

export async function ensureConsultationRoom(appointmentId: string): Promise<{ meetingUrl: string }> {
  if (appointmentId.startsWith("demo-")) {
    return { meetingUrl: "https://www.daily.co/healthyfy-demo-room" };
  }

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

export async function fetchSoapNotes(appointmentId: string) {
  const providerId = await getCurrentUserId();

  if (appointmentId.startsWith("demo-") || isDemoUserId(providerId)) {
    return readDemoSoapNotes()
      .filter((note) => note.appointment_id === appointmentId)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  try {
    const { data, error } = await supabase
      .from("clinical_notes")
      .select("id, appointment_id, patient_id, provider_id, subjective, objective, assessment, plan, created_at, updated_at")
      .eq("appointment_id", appointmentId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as SoapNoteRecord[];
  } catch (error) {
    if (isTransientBackendError(error)) {
      return readDemoSoapNotes()
        .filter((note) => note.appointment_id === appointmentId)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    }

    throw error;
  }
}

export async function fetchPatientSoapNotes(patientId: string) {
  const providerId = await getCurrentUserId();

  if (patientId.startsWith("demo-") || isDemoUserId(providerId)) {
    return readDemoSoapNotes()
      .filter((note) => note.patient_id === patientId)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  try {
    const { data, error } = await supabase
      .from("clinical_notes")
      .select("id, appointment_id, patient_id, provider_id, subjective, objective, assessment, plan, created_at, updated_at")
      .eq("patient_id", patientId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as SoapNoteRecord[];
  } catch (error) {
    if (isTransientBackendError(error)) {
      return readDemoSoapNotes()
        .filter((note) => note.patient_id === patientId)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    }

    throw error;
  }
}

export async function saveSoapNote(input: {
  noteId?: string;
  appointmentId: string;
  patientId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}) {
  const providerId = await getCurrentUserId();

  if (input.appointmentId.startsWith("demo-") || isDemoUserId(providerId)) {
    const now = new Date().toISOString();
    const notes = readDemoSoapNotes();
    const existing = input.noteId ? notes.find((note) => note.id === input.noteId) : null;

    const nextRecord: SoapNoteRecord = {
      id: existing?.id ?? `demo-soap-${Date.now()}`,
      appointment_id: input.appointmentId,
      patient_id: input.patientId,
      provider_id: providerId,
      subjective: input.subjective,
      objective: input.objective,
      assessment: input.assessment,
      plan: input.plan,
      created_at: existing?.created_at ?? now,
      updated_at: now
    };

    const updatedNotes = existing
      ? notes.map((note) => (note.id === existing.id ? nextRecord : note))
      : [nextRecord, ...notes];

    writeDemoSoapNotes(updatedNotes);
    logActivity(input.noteId ? "Updated SOAP Note" : "Created SOAP Note", `Clinical notes for patient ${input.patientId}`, "clinical");
    return nextRecord;
  }

  if (input.noteId) {
    const { data, error } = await supabase
      .from("clinical_notes")
      .update({
        subjective: input.subjective,
        objective: input.objective,
        assessment: input.assessment,
        plan: input.plan
      })
      .eq("id", input.noteId)
      .select("id, appointment_id, patient_id, provider_id, subjective, objective, assessment, plan, created_at, updated_at")
      .single();

    if (error) throw error;
    logActivity("Updated SOAP Note", `Clinical notes for patient ${input.patientId}`, "clinical");
    return data as SoapNoteRecord;
  }

  const { data, error } = await supabase
    .from("clinical_notes")
    .insert({
      appointment_id: input.appointmentId,
      patient_id: input.patientId,
      provider_id: providerId,
      subjective: input.subjective,
      objective: input.objective,
      assessment: input.assessment,
      plan: input.plan
    })
    .select("id, appointment_id, patient_id, provider_id, subjective, objective, assessment, plan, created_at, updated_at")
    .single();

  if (error) throw error;
  logActivity("Created SOAP Note", `Clinical notes for patient ${input.patientId}`, "clinical");
  return data as SoapNoteRecord;
}

export async function deleteSoapNote(noteId: string) {
  if (noteId.startsWith("demo-soap-")) {
    writeDemoSoapNotes(readDemoSoapNotes().filter((note) => note.id !== noteId));
    logActivity("Deleted SOAP Note", `Removed clinical note ${noteId}`, "clinical");
    return;
  }

  const { error } = await supabase.from("clinical_notes").delete().eq("id", noteId);
  if (error) throw error;
  logActivity("Deleted SOAP Note", `Removed clinical note ${noteId}`, "clinical");
}

export async function getAppointmentById(appointmentId: string) {
  if (appointmentId.startsWith("demo-")) {
    const appointment = [...buildDemoProviderAppointments("demo-provider-1"), ...buildDemoProviderAppointments("demo-provider-2"), ...buildDemoProviderAppointments("demo-provider-3")]
      .find((item) => item.id === appointmentId);

    if (!appointment) throw new Error("Appointment not found");

    return {
      id: appointment.id,
      patient_id: appointment.patient_id,
      provider_id: "demo-provider-1",
      start_time: appointment.start_time,
      status: appointment.status,
      meeting_url: appointment.meeting_url
    };
  }

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

  if (isDemoUserId(providerId) || patientId.startsWith("demo-") || appointmentId?.startsWith("demo-")) {
    return `demo-conversation-${appointmentId ?? `${providerId}-${patientId}`}`;
  }

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
  if (conversationId.startsWith("demo-conversation-")) {
    return readDemoMessages()
      .filter((message) => message.conversation_id === conversationId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, content, created_at, conversation_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  
  const messages = data ?? [];
  if (messages.length === 0) {
    const now = Date.now();
    return [
      {
        id: "demo-msg-1",
        sender_id: "system",
        recipient_id: "user",
        conversation_id: conversationId,
        content: "Hello! How can I help you today?",
        created_at: new Date(now - 1000 * 60 * 10).toISOString()
      },
      {
        id: "demo-msg-2",
        sender_id: "user",
        recipient_id: "system",
        conversation_id: conversationId,
        content: "I have a question about my last prescription.",
        created_at: new Date(now - 1000 * 60 * 5).toISOString()
      }
    ];
  }

  return messages;
}

export async function sendConversationMessage(input: {
  conversationId: string;
  recipientId: string;
  content: string;
}) {
  const senderId = await getCurrentUserId();

  if (input.conversationId.startsWith("demo-conversation-") || isDemoUserId(senderId) || input.recipientId.startsWith("demo-")) {
    const nextMessage = {
      id: `demo-message-${Date.now()}`,
      sender_id: senderId,
      recipient_id: input.recipientId,
      conversation_id: input.conversationId,
      content: input.content,
      created_at: new Date().toISOString()
    };

    writeDemoMessages([...readDemoMessages(), nextMessage]);
    logActivity("Sent Message", `Message to ${input.recipientId.startsWith("demo-") ? "Patient" : "Provider"}`, "message");
    return nextMessage;
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: senderId,
    recipient_id: input.recipientId,
    conversation_id: input.conversationId,
    content: input.content
  });
  if (error) throw error;

  logActivity("Sent Message", `Message to ${input.recipientId}`, "message");

  return {
    id: `message-${Date.now()}`,
    sender_id: senderId,
    recipient_id: input.recipientId,
    conversation_id: input.conversationId,
    content: input.content,
    created_at: new Date().toISOString()
  };
}

export function subscribeConversation(conversationId: string, onInsert: (payload: any) => void) {
  if (conversationId.startsWith("demo-conversation-")) {
    return { unsubscribe() {} };
  }

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
