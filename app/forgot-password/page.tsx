import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-forgot-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we&apos;ll send a secure recovery link to help you back into your account."
      asideTitle="Recover access without the friction."
      asideDescription="Healthyfy recovery flows are designed to be quick, secure, and easy to complete whether you&apos;re on your phone or desktop."
      footer={
        <>
          Remembered it? <Link href="/login" className="font-semibold text-primary">Back to sign in</Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
