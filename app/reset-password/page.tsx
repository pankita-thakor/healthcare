import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth-reset-password-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Create a new password"
      description="Choose a strong password to secure your account and continue back into your dashboard."
      asideTitle="Set a stronger password and get back in."
      asideDescription="Your new password updates instantly, so you can return to appointments, messages, and care activity without delay."
      footer={
        <>
          Need to start over? <Link href="/forgot-password" className="font-semibold text-primary">Request a new reset link</Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
