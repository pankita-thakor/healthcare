import Link from "next/link";
import { LoginForm } from "@/components/auth-login-form";
import { AuthShell } from "@/components/layout/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue."
      footer={
        <>
          New here? <Link href="/signup" className="text-primary">Create account</Link>
          {" · "}
          <Link href="/forgot-password" className="text-primary">Forgot password?</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
