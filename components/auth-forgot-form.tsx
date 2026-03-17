"use client";

import { useState } from "react";
import { forgotPassword } from "@/services/auth/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const fieldClassName =
  "h-12 rounded-xl border-border/60 bg-background/80 px-4 text-sm shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/30";

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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        Enter the email linked to your account. We&apos;ll send you a secure recovery link so you can create a new password.
      </div>

      <div className="space-y-2">
        <label htmlFor="forgot-email" className="text-sm font-semibold text-foreground">
          Email address
        </label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClassName}
          required
        />
      </div>

      <Button type="submit" className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={sending}>
        {sending ? "Sending reset link..." : "Send reset link"}
      </Button>

      {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      {status && <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{status}</p>}
    </form>
  );
}
