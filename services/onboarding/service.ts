import { createBrowserClient } from "@/lib/supabase";

const supabase = createBrowserClient();

function toReadableError(err: unknown) {
  if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
    return new Error(
      "Network error while contacting Supabase. Check NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, internet access, and then restart the dev server."
    );
  }

  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/not authenticated|session expired|invalid.*token/i.test(msg)) {
    return new Error(
      "Your session has expired or you're using a demo account. Please confirm your email (if required) and sign in with your real account to save your details."
    );
  }

  if (err instanceof Error) return err;
  return new Error("Unexpected onboarding error. Please try again.");
}

async function canTreatProviderConflictAsCompleted() {
  const { data, error } = await supabase
    .from("providers")
    .select("user_id, category_id, license_number, specialization")
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;

  return Boolean(data.category_id) || Boolean(data.license_number) || Boolean(data.specialization);
}

export async function completePatientOnboarding(input: {
  dob: string;
  gender: string;
  insurance: string;
  medicalHistory: string;
  phone?: string;
  bloodGroup?: string;
  conditionSummary?: string;
  allergies?: string;
  emergencyContact?: string;
}) {
  try {
    const { error } = await supabase.rpc("complete_patient_onboarding", {
      p_date_of_birth: input.dob,
      p_gender: input.gender,
      p_insurance: input.insurance,
      p_medical_history: input.medicalHistory,
      p_phone: input.phone ?? null,
      p_blood_group: input.bloodGroup ?? null,
      p_condition_summary: input.conditionSummary ?? null,
      p_allergies: input.allergies ?? null,
      p_emergency_contact: input.emergencyContact ?? null
    });

    if (error) throw error;
  } catch (err) {
    throw toReadableError(err);
  }
}

export async function completeProviderOnboarding(input: {
  categoryId: string;
  categoryName: string;
  licenseNumber: string;
  availability: string;
}) {
  try {
    const { error } = await supabase.rpc("complete_provider_onboarding", {
      p_category_id: input.categoryId,
      p_category_name: input.categoryName,
      p_license_number: input.licenseNumber,
      p_availability: { notes: input.availability }
    });

    if (error) throw error;
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";

    if (
      message.includes("duplicate") ||
      message.includes("conflict") ||
      message.includes("providers")
    ) {
      const alreadyProvisioned = await canTreatProviderConflictAsCompleted();
      if (alreadyProvisioned) return;
    }

    throw toReadableError(err);
  }
}
