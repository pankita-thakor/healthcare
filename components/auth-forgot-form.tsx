"use client";

import { useState } from "react";
import { forgotPassword } from "@/services/auth/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await forgotPassword(email);
    setStatus("Reset link sent. Check your inbox.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit" className="w-full">Send reset link</Button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </form>
  );
}
