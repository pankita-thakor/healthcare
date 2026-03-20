import { createBrowserClient } from "@/lib/supabase";
import {
  clearDemoSession,
  createDemoSessionForRole,
  getLocalAuthAccount,
  isDemoUserId,
  rememberLocalAuthAccount,
  writeDemoSession
} from "@/lib/demo-session";
import { safeGetUser } from "@/lib/supabase-auth";
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

type UserProfileRow = {
  role: UserRole | null;
  status: string | null;
};

type ProviderRoleRow = {
  user_id: string;
  category_id: string | null;
  license_number: string | null;
  specialization?: string | null;
  onboarding_completed?: boolean | null;
};

type PatientRoleRow = {
  user_id: string;
  onboarding_completed?: boolean | null;
};

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

function isEmailConfirmationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.toLowerCase().includes("email not confirmed");
}

function hasProviderProfile(row: ProviderRoleRow | null) {
  if (!row) return false;
  return Boolean(row.category_id || row.license_number || row.specialization || row.onboarding_completed);
}

async function resolveEffectiveRole(
  userId: string,
  fallbackRole: UserRole
): Promise<{ role: UserRole; status: string }> {
  let role = fallbackRole;
  let status = "active";

  try {
    const [userResult, providerResult, patientResult] = await Promise.all([
      supabase.from("users").select("role, status").eq("id", userId).maybeSingle(),
      supabase
        .from("providers")
        .select("user_id, category_id, license_number, specialization, onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("patients").select("user_id, onboarding_completed").eq("user_id", userId).maybeSingle()
    ]);

    if (userResult.error) throw userResult.error;
    if (providerResult.error) throw providerResult.error;
    if (patientResult.error) throw patientResult.error;

    const userProfile = (userResult.data ?? null) as UserProfileRow | null;
    const providerProfile = (providerResult.data ?? null) as ProviderRoleRow | null;
    const patientProfile = (patientResult.data ?? null) as PatientRoleRow | null;

    if (userProfile?.status) {
      status = userProfile.status;
    }

    // Prefer users.role when explicitly set (avoids wrong role when user has both patients + providers rows)
    if (userProfile?.role === "patient") {
      role = "patient";
    } else if (userProfile?.role === "provider" || hasProviderProfile(providerProfile) || (fallbackRole === "provider" && providerProfile?.user_id)) {
      role = "provider";
    } else if (patientProfile?.user_id) {
      role = "patient";
    } else if (userProfile?.role) {
      role = userProfile.role;
    }
  } catch (error) {
    if (!isHtmlResponseError(error)) {
      throw error;
    }
  }

  return { role, status };
}

function getAuthRedirectUrl(path: string) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const baseUrl =
    configuredBaseUrl && /^https?:\/\//.test(configuredBaseUrl)
      ? configuredBaseUrl.replace(/\/+$/, "")
      : typeof window !== "undefined"
        ? window.location.origin
        : "";

  if (!baseUrl) {
    throw new Error("Missing app URL for auth redirects.");
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function clearLocalAuthState() {
  clearDemoSession();

  if (typeof document !== "undefined") {
    document.cookie = "hf_user=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "hf_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
}

export function persistLocalAuthState(userId: string, role: UserRole) {
  if (typeof document === "undefined") return;

  document.cookie = `hf_user=${userId}; path=/; max-age=2592000; SameSite=Lax`;
  document.cookie = `hf_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
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

  if (input.role === "patient" || input.role === "provider") {
    await rememberLocalAuthAccount({
      email: input.email,
      password: input.password,
      role: input.role,
      fullName: input.name,
      phone: input.provider?.phone
    });
  }

  return data;
}

export async function login(email: string, password: string): Promise<{ id: string; role: UserRole; status: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw error ?? new Error("Authentication failed");
    clearDemoSession();

    const fallbackRole = (data.user.user_metadata.role as UserRole) ?? "patient";
    const { role, status } = await resolveEffectiveRole(data.user.id, fallbackRole);

    return { id: data.user.id, role, status };
  } catch (error) {
    const localAccount = await getLocalAuthAccount(email, password);
    if (localAccount && (isEmailConfirmationError(error) || isHtmlResponseError(error))) {
      const session = {
        ...createDemoSessionForRole(localAccount.role, localAccount.email),
        fullName: localAccount.fullName,
        email: localAccount.email,
        phone: localAccount.phone || (localAccount.role === "provider" ? "+91 99887 76655" : "+91 98765 43210")
      };
      writeDemoSession(session);
      return { id: session.id, role: session.role, status: "active" };
    }

    throw toReadableAuthError(error, "Authentication failed");
  }
}

export async function getPostLoginPath(userId: string, role: UserRole): Promise<string> {
  if (role === "admin") return "/dashboard/admin";
  if (isDemoUserId(userId)) {
    return role === "provider" ? "/dashboard/provider" : "/onboarding/patient";
  }

  if (role === "patient") {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data?.onboarding_completed) return "/onboarding/patient";
    } catch (error) {
      if (!isHtmlResponseError(error)) {
        throw toReadableAuthError(error, "Unable to determine the next page after login.");
      }
      return "/onboarding/patient";
    }

    return "/dashboard/patient";
  }

  return "/dashboard/provider";
}

export async function forgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl("/reset-password")
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

export async function updatePassword(newPassword: string, oldPassword?: string) {
  // If oldPassword is provided, verify it first by re-authenticating
  if (oldPassword) {
    const { user } = await safeGetUser();
    if (!user || !user.email) throw new Error("Not authenticated");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      throw new Error("Invalid current password. Please try again.");
    }
  }

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
