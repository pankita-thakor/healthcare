import { createBrowserClient } from "@/lib/supabase";
import { readDemoSession, writeDemoSession } from "@/lib/demo-session";
import type { UserRole } from "@/types";

const supabase = createBrowserClient();

export interface AccountProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
}

export async function fetchCurrentAccountProfile(): Promise<AccountProfile> {
  const demoSession = readDemoSession();
  if (demoSession) {
    return {
      id: demoSession.id,
      fullName: demoSession.fullName,
      email: demoSession.email,
      phone: demoSession.phone,
      role: demoSession.role,
      status: "active"
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, phone, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    id: data?.id ?? user.id,
    fullName: data?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
    email: data?.email ?? user.email ?? "",
    phone: data?.phone ?? (user.phone as string | undefined) ?? "",
    role: (data?.role as UserRole | undefined) ?? ((user.user_metadata?.role as UserRole | undefined) ?? "patient"),
    status: data?.status ?? "active"
  };
}

export async function saveCurrentAccountProfile(input: { fullName: string; phone: string }) {
  const demoSession = readDemoSession();
  if (demoSession) {
    writeDemoSession({
      ...demoSession,
      fullName: input.fullName,
      phone: input.phone
    });
    return;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("users")
    .update({
      full_name: input.fullName,
      phone: input.phone
    })
    .eq("id", user.id);

  if (error) throw error;
}
