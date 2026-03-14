"use client";

import { useState } from "react";
import { getPostLoginPath, login, persistLocalAuthState } from "@/services/auth/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email, password);
      persistLocalAuthState(user.id, user.role);

      const nextPath = await getPostLoginPath(user.id, user.role);
      window.location.href = nextPath;
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full">Sign in</Button>
    </form>
  );
}
