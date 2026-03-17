import { createBrowserClient } from "@/lib/supabase";
import { getClientUserId } from "@/lib/client-auth";
import { isDemoUserId } from "@/lib/demo-session";
import { readSyncedProviderSlots } from "@/lib/slot-sync";
import { logActivity } from "@/services/activity/service";

const supabase = createBrowserClient();
const DEMO_BOOKINGS_KEY = "hf_demo_bookings";

const DEMO_PROVIDER_PROFILES: BookableProviderProfile[] = [
  {
    provider_id: "demo-provider-1",
    provider_name: "Dr. Pankita Thakor",
    category_name: "Cardiology",
    hospital: "Healthyfy Care Center",
    experience: 8,
    bio: "Focuses on preventive heart care, follow-up plans, and virtual consultations."
  },
  {
    provider_id: "demo-provider-2",
    provider_name: "Dr. Meera Shah",
    category_name: "Dermatology",
    hospital: "Sunrise Clinic",
    experience: 6,
    bio: "Supports skin-care reviews, treatment planning, and quick follow-up consultations."
  },
  {
    provider_id: "demo-provider-3",
    provider_name: "Dr. Aarav Mehta",
    category_name: "General Medicine",
    hospital: "Metro Health Hub",
    experience: 10,
    bio: "Handles routine checkups, fever/cough consultations, and long-term wellness guidance."
  }
];

const DEMO_PROVIDER_SCHEDULES = [
  {
    provider_id: "demo-provider-1",
    slots: [
      { day_of_week: 1, start_time: "10:00", end_time: "10:30" },
      { day_of_week: 3, start_time: "15:00", end_time: "15:30" },
      { day_of_week: 5, start_time: "11:30", end_time: "12:00" }
    ]
  },
  {
    provider_id: "demo-provider-2",
    slots: [
      { day_of_week: 2, start_time: "12:00", end_time: "12:30" },
      { day_of_week: 4, start_time: "16:00", end_time: "16:30" },
      { day_of_week: 6, start_time: "10:30", end_time: "11:00" }
    ]
  },
  {
    provider_id: "demo-provider-3",
    slots: [
      { day_of_week: 1, start_time: "18:00", end_time: "18:30" },
      { day_of_week: 2, start_time: "09:30", end_time: "10:00" },
      { day_of_week: 4, start_time: "14:30", end_time: "15:00" }
    ]
  }
];

function toReadableAppointmentError(err: unknown) {
  if (!(err instanceof Error)) {
    return new Error("Unable to load appointment slots right now.");
  }

  const message = err.message || "";
  const lower = message.toLowerCase();

  if (lower.includes("<!doctype") || lower.includes("<html") || lower.includes("error code: 521") || lower.includes("error code 521")) {
    return new Error(
      "Provider slots are temporarily unavailable. Apply the latest Supabase migrations for slot sync and try again."
    );
  }

  if (lower.includes("fetch_bookable_provider_slots") || lower.includes("book_provider_slot")) {
    return new Error(
      "Slot sync is not ready in the database yet. Apply the latest Supabase migrations and reload."
    );
  }

  return err;
}

export interface BookableProviderSlot {
  slot_id: string;
  provider_id: string;
  provider_name: string | null;
  category_name: string | null;
  slot_start: string;
  slot_end: string;
  day_of_week: number;
}

export interface BookableProviderProfile {
  provider_id: string;
  provider_name: string | null;
  category_name: string | null;
  hospital: string | null;
  experience: number | null;
  bio: string | null;
}

type ProviderAvailabilityPayload = {
  slots?: Array<{
    id?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active?: boolean;
  }>;
} | null;

type LinkedProviderRow = {
  user_id: string;
  availability: ProviderAvailabilityPayload;
  specialization: string | null;
  hospital?: string | null;
  experience?: number | null;
  bio?: string | null;
  users?: { full_name: string | null } | { full_name: string | null }[] | null;
};

type ExistingAppointmentRow = {
  provider_id: string;
  start_time: string;
  status: string;
};

type DemoBookingRow = {
  id: string;
  patient_id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string | null;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readDemoBookings(): DemoBookingRow[] {
  if (!canUseLocalStorage()) return [];

  const raw = localStorage.getItem(DEMO_BOOKINGS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as DemoBookingRow[];
  } catch {
    localStorage.removeItem(DEMO_BOOKINGS_KEY);
    return [];
  }
}

function writeDemoBookings(bookings: DemoBookingRow[]) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(DEMO_BOOKINGS_KEY, JSON.stringify(bookings));
}

function resolveRelationName(row: LinkedProviderRow) {
  if (Array.isArray(row.users)) {
    return row.users[0]?.full_name ?? null;
  }

  return row.users?.full_name ?? null;
}

function buildFallbackBookableSlots(
  providers: LinkedProviderRow[],
  existingAppointments: ExistingAppointmentRow[],
  daysAhead: number
): BookableProviderSlot[] {
  const now = new Date();
  const appointmentKeys = new Set(
    existingAppointments
      .filter((appointment) => ["pending", "confirmed", "completed"].includes(appointment.status))
      .map((appointment) => `${appointment.provider_id}:${appointment.start_time}`)
  );

  const slots: BookableProviderSlot[] = [];

  for (const provider of providers) {
    const providerSlots = provider.availability?.slots ?? [];
    for (const slot of providerSlots) {
      if (slot.is_active === false) continue;

      for (let offset = 0; offset < daysAhead; offset += 1) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() + offset);
        if (day.getDay() !== slot.day_of_week) continue;

        const [startHours, startMinutes] = slot.start_time.slice(0, 5).split(":").map(Number);
        const [endHours, endMinutes] = slot.end_time.slice(0, 5).split(":").map(Number);

        const slotStart = new Date(day);
        slotStart.setHours(startHours, startMinutes, 0, 0);
        const slotEnd = new Date(day);
        slotEnd.setHours(endHours, endMinutes, 0, 0);

        if (slotStart <= now) continue;

        const slotStartIso = slotStart.toISOString();
        if (appointmentKeys.has(`${provider.user_id}:${slotStartIso}`)) continue;

        slots.push({
          slot_id: slot.id ?? `${provider.user_id}-${slot.day_of_week}-${slot.start_time}-${slot.end_time}`,
          provider_id: provider.user_id,
          provider_name: resolveRelationName(provider),
          category_name: provider.specialization,
          slot_start: slotStartIso,
          slot_end: slotEnd.toISOString(),
          day_of_week: slot.day_of_week
        });
      }
    }
  }

  return slots.sort((a, b) => a.slot_start.localeCompare(b.slot_start));
}

function buildDemoBookableSlots(daysAhead: number): BookableProviderSlot[] {
  const existingAppointments = readDemoBookings().map((booking) => ({
    provider_id: booking.provider_id,
    start_time: booking.start_time,
    status: booking.status
  }));

  const providers: LinkedProviderRow[] = DEMO_PROVIDER_SCHEDULES.map((providerSchedule) => {
    const profile = DEMO_PROVIDER_PROFILES.find((profileItem) => profileItem.provider_id === providerSchedule.provider_id);

    return {
      user_id: providerSchedule.provider_id,
      specialization: profile?.category_name ?? null,
      hospital: profile?.hospital ?? null,
      experience: profile?.experience ?? null,
      bio: profile?.bio ?? null,
      users: { full_name: profile?.provider_name ?? "Provider" },
      availability: {
        slots: providerSchedule.slots.map((slot, index) => ({
          id: `${providerSchedule.provider_id}-${slot.day_of_week}-${slot.start_time}-${index}`,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_active: true
        }))
      }
    };
  });

  return buildFallbackBookableSlots(providers, existingAppointments, daysAhead);
}

export async function fetchBookableProviderProfiles(providerIds: string[]): Promise<BookableProviderProfile[]> {
  if (!providerIds.length) return [];

  try {
    const { data, error } = await supabase
      .from("providers")
      .select("user_id, specialization, hospital, experience, bio, users(full_name)")
      .in("user_id", providerIds);

    if (error) throw error;

    return ((data ?? []) as LinkedProviderRow[]).map((provider) => ({
      provider_id: provider.user_id,
      provider_name: resolveRelationName(provider),
      category_name: provider.specialization,
      hospital: provider.hospital ?? null,
      experience: provider.experience ?? null,
      bio: provider.bio ?? null
    }));
  } catch {
    const syncedProfiles = new Map<string, BookableProviderProfile>();

    for (const slot of readSyncedProviderSlots()) {
      if (!providerIds.includes(slot.provider_id) || syncedProfiles.has(slot.provider_id)) continue;

      syncedProfiles.set(slot.provider_id, {
        provider_id: slot.provider_id,
        provider_name: slot.provider_name,
        category_name: slot.category_name,
        hospital: null,
        experience: null,
        bio: null
      });
    }

    return providerIds.map((providerId) => {
      const fallback = syncedProfiles.get(providerId);
      const demoProfile = DEMO_PROVIDER_PROFILES.find((profile) => profile.provider_id === providerId);
      return {
        provider_id: providerId,
        provider_name: fallback?.provider_name ?? demoProfile?.provider_name ?? "Provider",
        category_name: fallback?.category_name ?? demoProfile?.category_name ?? null,
        hospital: fallback?.hospital ?? demoProfile?.hospital ?? null,
        experience: fallback?.experience ?? demoProfile?.experience ?? null,
        bio: fallback?.bio ?? demoProfile?.bio ?? null
      };
    });
  }
}

export async function fetchBookableProviderSlots(daysAhead = 14): Promise<BookableProviderSlot[]> {
  try {
    const { data, error } = await supabase.rpc("fetch_bookable_provider_slots", {
      p_days_ahead: daysAhead
    });

    if (error) throw error;
    return (data ?? []) as BookableProviderSlot[];
  } catch (err) {
    try {
      const { data: existingAppointments } = await supabase
        .from("appointments")
        .select("provider_id, start_time, status");

      const localProvidersMap = new Map<string, LinkedProviderRow>();
      for (const slot of readSyncedProviderSlots()) {
        const current = localProvidersMap.get(slot.provider_id);
        const normalizedSlot = {
          id: `${slot.provider_id}-${slot.day_of_week}-${slot.start_time}-${slot.end_time}`,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_active: slot.is_active
        };

        if (current) {
          current.availability = {
            slots: [...(current.availability?.slots ?? []), normalizedSlot]
          };
          continue;
        }

        localProvidersMap.set(slot.provider_id, {
          user_id: slot.provider_id,
          availability: { slots: [normalizedSlot] },
          specialization: slot.category_name,
          users: { full_name: slot.provider_name }
        });
      }

      const fallbackSlots = buildFallbackBookableSlots(
        Array.from(localProvidersMap.values()),
        (existingAppointments ?? []) as ExistingAppointmentRow[],
        daysAhead
      );
      return fallbackSlots.length ? fallbackSlots : buildDemoBookableSlots(daysAhead);
    } catch {
      if (err instanceof Error) {
        return buildDemoBookableSlots(daysAhead);
      }
      throw toReadableAppointmentError(err);
    }
  }
}

export async function bookAppointment(input: {
  patientId: string;
  providerId: string;
  startTime: string;
  endTime?: string;
  reason?: string;
}) {
  const endTime = input.endTime ?? new Date(new Date(input.startTime).getTime() + 30 * 60 * 1000).toISOString();
  const shouldUseDemoFallback = isDemoUserId(input.patientId) || isDemoUserId(input.providerId);

  try {
    if (shouldUseDemoFallback) {
      throw new Error("Using demo booking fallback");
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc("book_provider_slot", {
      p_provider_id: input.providerId,
      p_slot_start: new Date(input.startTime).toISOString(),
      p_slot_end: new Date(endTime).toISOString(),
      p_reason: input.reason ?? "Scheduled from patient dashboard"
    });

    if (!rpcError) {
      logActivity("Booked Appointment", `Confirmed slot for ${new Date(input.startTime).toLocaleString()}`, "appointment");
      return rpcData;
    }

    let meetingUrl: string | null = null;
    try {
      const roomRes = await fetch("/api/video/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingName: `visit-${Date.now()}` })
      });

      if (roomRes.ok) {
        const room = await roomRes.json();
        meetingUrl = (room.url as string | undefined) ?? null;
      }
    } catch {
      meetingUrl = null;
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: input.patientId,
        provider_id: input.providerId,
        start_time: new Date(input.startTime).toISOString(),
        end_time: endTime,
        status: "pending",
        reason: input.reason ?? "Scheduled from patient dashboard",
        meeting_url: meetingUrl
      })
      .select()
      .single();

    if (error) throw error;
    logActivity("Requested Appointment", `Requested slot for ${new Date(input.startTime).toLocaleString()}`, "appointment");
    return data;
  } catch (err) {
    if (shouldUseDemoFallback || err instanceof Error) {
      const booking = {
        id: `demo-booking-${Date.now()}`,
        patient_id: input.patientId,
        provider_id: input.providerId,
        start_time: new Date(input.startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        status: "pending",
        reason: input.reason ?? "Scheduled from patient dashboard"
      };

      writeDemoBookings([...readDemoBookings(), booking]);
      logActivity("Requested Appointment", `Demo: Requested slot for ${new Date(input.startTime).toLocaleString()}`, "appointment");
      return booking;
    }

    throw toReadableAppointmentError(err);
  }
}

export async function getAppointmentsByUser(userId: string, role: "patient" | "provider") {
  const field = role === "patient" ? "patient_id" : "provider_id";
  const { data, error } = await supabase.from("appointments").select("*").eq(field, userId).order("start_time", { ascending: false });
  if (error) throw error;
  return data;
}
