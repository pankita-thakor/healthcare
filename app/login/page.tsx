import Link from "next/link";
import { LoginForm } from "@/components/auth-login-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to access appointments, care plans, and your Healthyfy dashboard."
      asideTitle="Your care journey, ready when you are."
      asideDescription="Log in to manage appointments, follow-ups, messages, and care insights with a seamless experience across mobile and desktop."
      footer={
        <>
          New here? <Link href="/signup" className="font-semibold text-primary">Create account</Link>
          {" · "}
          <Link href="/forgot-password" className="font-semibold text-primary">Forgot password?</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
