import Link from "next/link";
import { SignupForm } from "@/components/auth-signup-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your HealthFlow account"
      description="Set up a patient or provider workspace with a layout optimized for every screen."
      footer={
        <>
          Already have an account? <Link href="/login" className="text-primary">Sign in</Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
