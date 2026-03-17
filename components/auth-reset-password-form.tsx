"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeRecoverySession, updatePassword } from "@/services/auth/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const fieldClassName =
  "h-12 rounded-xl border-border/60 bg-background/80 px-4 text-sm shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/30";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string>("Validating reset link...");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setStatus("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await updatePassword(password);
      setStatus("Password updated. Redirecting to sign in...");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err) {
      setError((err as Error).message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {status && <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{status}</p>}
      {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <label htmlFor="reset-password" className="text-sm font-semibold text-foreground">
          New password
        </label>
        <Input
          id="reset-password"
          type="password"
          placeholder="Create a new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!ready || saving}
          className={fieldClassName}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="reset-confirm-password" className="text-sm font-semibold text-foreground">
            Confirm password
          </label>
          <span className="text-xs text-muted-foreground">Use at least 8 characters</span>
        </div>
        <Input
          id="reset-confirm-password"
          type="password"
          placeholder="Repeat your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!ready || saving}
          className={fieldClassName}
          required
        />
      </div>

      <Button type="submit" className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={!ready || saving}>
        {saving ? "Updating password..." : "Update password"}
      </Button>
    </form>
  );
}
