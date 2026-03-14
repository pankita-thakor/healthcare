import { PatientOnboardingForm } from "@/components/patient-onboarding-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function PatientOnboardingPage() {
  return (
    <AuthShell
      title="Patient onboarding"
      description="Complete your profile so booking, messaging, and records are personalized from the first login."
    >
      <PatientOnboardingForm />
    </AuthShell>
  );
}
