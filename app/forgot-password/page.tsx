import { ForgotPasswordForm } from "@/components/auth-forgot-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="Enter your email and we will send a recovery link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
