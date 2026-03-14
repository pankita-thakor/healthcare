import { ResetPasswordForm } from "@/components/auth-reset-password-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Create a new password"
      description="Choose a secure password to continue back into your dashboard."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
