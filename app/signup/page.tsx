import Link from "next/link";
import { SignupForm } from "@/components/auth-signup-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your Healthyfy account"
      description="Set up your patient, provider, or admin workspace with a smooth onboarding experience on every screen."
      asideTitle="Start with a beautiful, guided onboarding flow."
      asideDescription="Create your account in minutes and step into a connected care platform built for patients, providers, and operations teams."
      footer={
        <>
          Already have an account? <Link href="/login" className="font-semibold text-primary">Sign in</Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
