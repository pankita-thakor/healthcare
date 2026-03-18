import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, CalendarCheck2, HeartPulse, ShieldCheck, Sparkles, Stethoscope, ArrowUpRight } from "lucide-react";

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
  const featureCards = [
    {
      title: "Smart scheduling",
      description: "Appointments, follow-ups, and care plans stay aligned without extra admin work.",
      icon: CalendarCheck2,
      iconClassName: "bg-primary/12 text-primary"
    },
    {
      title: "Protected access",
      description: "Patients, providers, and admins move through secure access flows with less friction.",
      icon: ShieldCheck,
      iconClassName: "bg-emerald-500/12 text-emerald-600"
    }
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.14),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-4%] h-80 w-80 rounded-full bg-primary/12 blur-[130px]" />
        <div className="absolute bottom-[-8%] right-[-4%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.14)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.14)_1px,transparent_1px)] bg-[size:88px_88px] opacity-20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <div className="relative grid min-h-screen w-full lg:grid-cols-[minmax(320px,1.1fr)_minmax(420px,0.9fr)]">
        <section className="hidden border-r border-border/40 bg-background/30 px-8 py-10 backdrop-blur-2xl lg:flex lg:flex-col lg:justify-center xl:px-12 xl:py-12">
          <div className="space-y-8">
            <div className="space-y-6">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/20">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
                  <p className="text-sm text-muted-foreground">Connected healthcare workspace</p>
                </div>
              </Link>

              <div className="max-w-xl space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/7 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-primary">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Care access, reimagined
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground xl:text-6xl xl:leading-[0.95]">{asideTitle}</h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground xl:text-lg">{asideDescription}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {featureCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="group rounded-[2.25rem] border border-white/50 bg-white/70 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_-30px_rgba(14,165,233,0.28)] dark:border-white/10 dark:bg-background/70"
                  >
                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.18em] text-foreground/80">{card.title}</p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.description}</p>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative mt-6 overflow-hidden rounded-[2.25rem] border border-white/50 bg-white/70 p-6 shadow-[0_24px_80px_-34px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-background/70">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">Designed for every auth step</p>
                    <p className="text-xs text-muted-foreground">Login, signup, recovery, reset</p>
                  </div>
                </div>
                <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary">Responsive</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1.15fr,0.85fr]">
                <div className="rounded-[1.6rem] border border-white/60 bg-background/85 p-5 shadow-sm dark:border-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/70">Always available</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-foreground">24/7</p>
                  <p className="mt-2 text-sm text-muted-foreground">Access your care account anytime with secure flows built for every role.</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/60 bg-background/85 p-5 shadow-sm dark:border-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600/80">Fast entry</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-foreground">Fast</p>
                  <p className="mt-2 text-sm text-muted-foreground">Cleaner forms, clearer actions, and smoother transitions on mobile and desktop.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-background/70">
                <Activity className="h-4 w-4 text-primary" />
                Smooth patient and provider flows
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-background/70">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Secure account recovery
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
          <div className="w-full">
            <div className="mx-auto w-full max-w-xl space-y-6 sm:space-y-8">
              <div className="rounded-[2.25rem] border border-white/50 bg-white/70 p-5 shadow-[0_28px_90px_-40px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-background/72 sm:p-8">
                <div className="mb-8 space-y-5">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/6 px-4 py-2 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
                        <HeartPulse className="h-4 w-4" />
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
                        <p className="text-xs text-muted-foreground lg:hidden">Care access across every device</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h2>
                      {description && <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.9rem] border border-white/60 bg-card/88 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_24px_60px_-40px_rgba(14,165,233,0.35)] sm:p-6 dark:border-white/10">
                  {children}
                </div>
              </div>

              {footer && <div className="px-1 text-sm leading-6 text-muted-foreground">{footer}</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
