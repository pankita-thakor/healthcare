"use client";

import { useState } from "react";
import { getPostLoginPath, login, persistLocalAuthState } from "@/services/auth/service";
import { usePageLoader } from "@/components/layout/CreativeLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fieldClassName =
  "h-12 rounded-2xl border border-slate-200 bg-slate-50/95 px-4 text-sm text-foreground shadow-[0_8px_24px_-20px_rgba(15,23,42,0.28)] transition placeholder:text-slate-400 focus-visible:border-primary/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-background/90 dark:placeholder:text-muted-foreground/70";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { setLoading } = usePageLoader();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email, password);
      setLoading(true);
      persistLocalAuthState(user.id, user.role);

      const nextPath = await getPostLoginPath(user.id, user.role);
      window.location.href = nextPath;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5">
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-semibold text-foreground">
            Email address
          </label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClassName}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="text-sm font-semibold text-foreground">
              Password
            </label>
            <span className="text-xs font-medium text-muted-foreground">Minimum 8 characters</span>
          </div>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={fieldClassName}
            required
          />
        </div>
      </div>

      {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="h-12 w-full rounded-2xl text-sm font-bold shadow-lg shadow-primary/20">
        Sign in
      </Button>
    </form>
  );
}
