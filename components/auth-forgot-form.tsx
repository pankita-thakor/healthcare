"use client";

import { useState } from "react";
import { forgotPassword } from "@/services/auth/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    setSending(true);

    try {
      await forgotPassword(email);
      setStatus("Reset link sent. Open the email and use the button to continue to the reset page.");
    } catch (err) {
      setError((err as Error).message || "Could not send reset link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? "Sending reset link..." : "Send reset link"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </form>
  );
}
