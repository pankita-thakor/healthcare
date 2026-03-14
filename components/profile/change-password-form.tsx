"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword } from "@/services/auth/service";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

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

    setSaving(true);
    try {
      await updatePassword(password);
      setStatus("Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id="security" onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      {status && <p className="text-sm text-emerald-600 md:col-span-2">{status}</p>}
      <div className="md:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Updating..." : "Change password"}
        </Button>
      </div>
    </form>
  );
}
