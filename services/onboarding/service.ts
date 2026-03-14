import { createBrowserClient } from "@/lib/supabase";

const supabase = createBrowserClient();

function toReadableError(err: unknown) {
  if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
    return new Error(
      "Network error while contacting Supabase. Check NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, internet access, and then restart the dev server."
    );
  }

  if (err instanceof Error) {
    return err;
  }

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
}) {
  try {
    const { error } = await supabase.rpc("complete_patient_onboarding", {
      p_date_of_birth: input.dob,
      p_gender: input.gender,
      p_insurance: input.insurance,
      p_medical_history: input.medicalHistory
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
