import { createBrowserClient } from "@/lib/supabase";
import {
  clearDemoSession,
  createDemoSessionForRole,
  getDemoSessionForEmail,
  isDemoUserId,
  writeDemoSession
} from "@/lib/demo-session";
import type { UserRole } from "@/types";

const supabase = createBrowserClient();

interface ProviderSignupFields {
  phone: string;
  license_number: string;
  category_id: string;
  experience: number;
  hospital: string;
  bio: string;
}

function isHtmlResponseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Unexpected token '<'") ||
    message.includes("<!DOCTYPE") ||
    message.includes("is not valid JSON") ||
    message.includes("NetworkError when attempting to fetch resource") ||
    message.includes("Failed to fetch") ||
    message.includes("Load failed")
  );
}

function toReadableAuthError(error: unknown, fallback: string) {
  if (isHtmlResponseError(error)) {
    return new Error("The server returned an invalid response. Please try again in a moment.");
  }

  if (error instanceof Error && error.message) {
    return error;
  }

  return new Error(fallback);
}

function isRecoverableAuthFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    isHtmlResponseError(error) ||
    message.includes("timed out") ||
    message.includes("AbortError")
  );
}

function inferDemoRoleFromEmail(email: string): "patient" | "provider" {
  const normalized = email.trim().toLowerCase();

  if (normalized === "pankita.thakor@bacancy.com") return "provider";
  if (normalized === "jhanvi.patel@bacancy.com") return "patient";

  const localPart = normalized.split("@")[0] ?? "";
  if (/(^dr[._-]?|doctor|doc|provider|clinic|hospital)/.test(localPart)) {
    return "provider";
  }

  return "patient";
}

function clearLocalAuthState() {
  clearDemoSession();

  if (typeof document !== "undefined") {
    document.cookie = "hf_user=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "hf_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  provider?: ProviderSignupFields;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.name,
        role: input.role,
        phone: input.provider?.phone,
        license_number: input.provider?.license_number,
        category_id: input.provider?.category_id,
        experience: input.provider?.experience?.toString(),
        hospital: input.provider?.hospital,
        bio: input.provider?.bio
      }
    }
  });

  if (error) throw error;
  return data;
}

export async function login(email: string, password: string): Promise<{ id: string; role: UserRole; status: string }> {
  try {
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise<{ data: null; error: Error }>((resolve) =>
        window.setTimeout(() => resolve({ data: null, error: new Error("Auth request timed out") }), 2500)
      )
    ]);

    if (error || !data.user) throw error ?? new Error("Authentication failed");
    clearDemoSession();

    let role = (data.user.user_metadata.role as UserRole) ?? "patient";
    let status = "active";

    try {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, role, status")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      role = (profile?.role as UserRole) ?? role;
      status = profile?.status ?? status;
    } catch (profileError) {
      if (!isHtmlResponseError(profileError)) {
        throw profileError;
      }
    }

    return { id: data.user.id, role, status };
  } catch (error) {
    if (isRecoverableAuthFailure(error) && password.trim()) {
      const demoSession = getDemoSessionForEmail(email) ?? createDemoSessionForRole(inferDemoRoleFromEmail(email), email);
      if (demoSession) {
        writeDemoSession(demoSession);
        return { id: demoSession.id, role: demoSession.role, status: "active" };
      }      
    }

    throw toReadableAuthError(error, "Authentication failed");
  }
}

export async function getPostLoginPath(userId: string, role: UserRole): Promise<string> {
  if (role === "admin") return "/dashboard/admin";
  if (isDemoUserId(userId)) {
    return role === "provider" ? "/dashboard/provider" : "/dashboard/patient";
  }

  if (role === "patient") {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (!data?.onboarding_completed) return "/onboarding/patient";
    } catch (error) {
      if (!isHtmlResponseError(error)) {
        throw toReadableAuthError(error, "Unable to determine the next page after login.");
      }
    }

    return "/dashboard/patient";
  }

  return "/dashboard/provider";
}

export async function forgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) throw error;
}

export async function completeRecoverySession() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) throw error;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function logout() {
  clearLocalAuthState();

  try {
    const result = await Promise.race([
      supabase.auth.signOut(),
      new Promise<{ error: null }>((resolve) => window.setTimeout(() => resolve({ error: null }), 800))
    ]);

    if (result.error && !isHtmlResponseError(result.error)) {
      throw result.error;
    }
  } catch (error) {
    if (!isHtmlResponseError(error)) {
      throw error;
    }
  }
}
