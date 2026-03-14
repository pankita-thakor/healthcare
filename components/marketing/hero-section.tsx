import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-8 md:p-16 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-2xl space-y-6">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Virtual Care Platform</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">HealthFlow helps clinics run telehealth at scale.</h1>
        <p className="text-muted-foreground">Book visits, hold secure video sessions, message providers, and automate operations with AI-assisted workflows.</p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
