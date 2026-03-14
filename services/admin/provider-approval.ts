import { createBrowserClient } from "@/lib/supabase";

const supabase = createBrowserClient();

export interface PendingProvider {
  providerId: string;
  userId: string;
  name: string;
  email: string;
  specialization: string | null;
  licenseNumber: string | null;
}

export async function fetchPendingProviders(): Promise<PendingProvider[]> {
  const { data: providers, error } = await supabase
    .from("providers")
    .select("id, user_id, specialization, license_number, status")
    .eq("status", "pending_approval");

  if (error) throw error;
  if (!providers?.length) return [];

  const userIds = providers.map((p) => p.user_id);
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name")
    .in("id", userIds);

  if (userError) throw userError;

  const map = new Map((users ?? []).map((user) => [user.id, user]));
  return providers.map((provider) => {
    const user = map.get(provider.user_id);
    return {
      providerId: provider.id,
      userId: provider.user_id,
      name: user?.full_name ?? "Unknown",
      email: user?.email ?? "",
      specialization: provider.specialization,
      licenseNumber: provider.license_number
    };
  });
}

export async function reviewProvider(userId: string, decision: "active" | "rejected") {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const updates = {
    status: decision,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id
  };

  const { error: providerError } = await supabase.from("providers").update(updates).eq("user_id", userId);
  if (providerError) throw providerError;

  const { error: userError } = await supabase.from("users").update({ status: decision }).eq("id", userId);
  if (userError) throw userError;
}
