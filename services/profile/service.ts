import { createBrowserClient } from "@/lib/supabase";
import type { UserRole } from "@/types";

export interface AccountProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
  // Patient specific fields
  dob?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  insurance?: string | null;
  medicalHistory?: string | null;
}

export async function fetchCurrentAccountProfile(): Promise<AccountProfile> {
  const supabase = createBrowserClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const [{ data: userData, error: userError }, { data: patientData, error: patientError }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, phone, role, status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("patients")
      .select("date_of_birth, gender, blood_group, insurance, medical_history")
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  if (userError) throw userError;

  return {
    id: userData?.id ?? user.id,
    fullName: userData?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
    email: userData?.email ?? user.email ?? "",
    phone: userData?.phone ?? (user.phone as string | undefined) ?? "",
    role: (userData?.role as UserRole | undefined) ?? ((user.user_metadata?.role as UserRole | undefined) ?? "patient"),
    status: userData?.status ?? "active",
    dob: patientData?.date_of_birth,
    gender: patientData?.gender,
    bloodGroup: patientData?.blood_group,
    insurance: patientData?.insurance,
    medicalHistory: patientData?.medical_history
  };
}

export async function saveCurrentAccountProfile(input: { 
  fullName: string; 
  phone: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  insurance?: string;
  medicalHistory?: string;
}) {
  const supabase = createBrowserClient();
  
  // Use the RPC to update multiple tables in one secure transaction
  // This also avoids CORS issues with PATCH requests on some environments
  const { error } = await supabase.rpc("update_my_profile", {
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_insurance: input.insurance || null,
    p_medical_history: input.medicalHistory || null
  });

  if (error) {
    console.error("Error updating profile via RPC:", error);
    throw error;
  }
}
