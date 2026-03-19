import { createBrowserClient } from "@/lib/supabase";
import { getClientUserId } from "@/lib/client-auth";
import { logActivity } from "@/services/activity/service";

const supabase = createBrowserClient();

// Simplified interface for the new system
export interface ProviderAvailability {
  available_date: string;
  start_time: string;
  end_time: string;
}

async function getCurrentUserId() {
  const cookieUserId = typeof document !== "undefined" ? getClientUserId() : null;
  if (cookieUserId) return cookieUserId;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * Fetches the single availability record for the current provider.
 */
export async function fetchProviderAvailability(): Promise<ProviderAvailability | null> {
  const providerId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("provider_availability")
    .select("available_date, start_time, end_time")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching availability:", error);
    throw error;
  }
  return data;
}

/**
 * Sets or updates the single availability entry for the current provider.
 */
export async function setProviderAvailability(input: {
  date: string;
  startTime: string;
  endTime: string;
}) {
  const providerId = await getCurrentUserId();
  const { error } = await supabase
    .from("provider_availability")
    .upsert({
      provider_id: providerId,
      available_date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Error setting availability:", error);
    throw error;
  }
  logActivity("Set Availability", `Set availability for ${input.date}`, "availability");
}

/**
 * Deletes the availability for the current provider.
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
