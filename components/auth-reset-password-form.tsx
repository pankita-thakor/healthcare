"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeRecoverySession, updatePassword } from "@/services/auth/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string>("Validating reset link...");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initRecovery() {
      try {
        await completeRecoverySession();
        setReady(true);
        setStatus("Set your new password.");
      } catch (err) {
        setError((err as Error).message || "Invalid or expired reset link.");
        setStatus("");
      }
    }

    void initRecovery();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await updatePassword(password);
      setStatus("Password updated. Redirecting to sign in...");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err) {
      setError((err as Error).message || "Could not update password.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={!ready}
        required
      />
      <Input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={!ready}
        required
      />
      <Button type="submit" className="w-full" disabled={!ready}>
        Update password
      </Button>
    </form>
  );
}
