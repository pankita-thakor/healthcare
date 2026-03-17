import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, CalendarCheck2, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";

interface AuthShellProps {
  title: string;
  description?: string;
  eyebrow?: string;
  asideTitle?: string;
  asideDescription?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  title,
  description,
  eyebrow = "Healthyfy",
  asideTitle = "Care that stays connected.",
  asideDescription = "Manage appointments, messages, and follow-ups in a dashboard that works smoothly across desktop and mobile.",
  children,
  footer
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_28%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.14),transparent_28%),hsl(var(--background))]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.18)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.18)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      </div>

      <div className="relative grid min-h-screen w-full lg:grid-cols-[minmax(320px,1.1fr)_minmax(420px,0.9fr)]">
        <section className="hidden border-r border-border/50 bg-background/40 px-8 py-10 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between xl:px-12 xl:py-12">
          <div className="space-y-10">
            <div className="space-y-6">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
                  <p className="text-sm text-muted-foreground">Connected healthcare workspace</p>
                </div>
              </Link>

              <div className="max-w-xl space-y-5">
                <h1 className="text-4xl font-black tracking-tight text-foreground xl:text-6xl xl:leading-[0.95]">{asideTitle}</h1>
                <p className="max-w-lg text-base leading-7 text-muted-foreground xl:text-lg">{asideDescription}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-border/60 bg-background/80 p-6 shadow-xl shadow-primary/5 backdrop-blur">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CalendarCheck2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary/70">Smart Scheduling</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Appointments, follow-ups, and care plans stay perfectly in sync across devices.</p>
              </div>
              <div className="rounded-[2rem] border border-border/60 bg-background/80 p-6 shadow-xl shadow-primary/5 backdrop-blur">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-600/80">Protected Access</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Secure sign-in flows designed for patients, providers, and admins.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border/60 bg-background/75 p-6 shadow-xl shadow-primary/5 backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">Designed for every auth step</p>
                    <p className="text-xs text-muted-foreground">Login, signup, recovery, reset</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary">Responsive</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
                  <p className="text-2xl font-black">24/7</p>
                  <p className="mt-1 text-sm text-muted-foreground">Access your care account anytime.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
                  <p className="text-2xl font-black">Fast</p>
                  <p className="mt-1 text-sm text-muted-foreground">Mobile-first forms with clear actions.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2">
                <Activity className="h-4 w-4 text-primary" />
                Smooth patient and provider flows
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Secure account recovery
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
          <div className="w-full">
            <div className="mx-auto w-full max-w-xl space-y-6 sm:space-y-8">
              <div className="rounded-[2rem] border border-border/60 bg-background/75 p-5 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-8">
                <div className="mb-8 space-y-5">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <HeartPulse className="h-4 w-4" />
                      </div>
                      <div className="leading-tight">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
                        <p className="text-xs text-muted-foreground lg:hidden">Care access across every device</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h2>
                      {description && <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-lg shadow-primary/5 sm:p-6">{children}</div>
              </div>

              {footer && <div className="px-1 text-sm leading-6 text-muted-foreground">{footer}</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
