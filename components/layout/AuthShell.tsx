import type { ReactNode } from "react";

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
    <main className="min-h-screen w-full bg-background">
      <div className="grid min-h-screen w-full lg:grid-cols-[minmax(320px,1.1fr)_minmax(380px,0.9fr)]">
        <section className="hidden border-r bg-muted/30 p-8 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
            <div className="max-w-xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight xl:text-5xl">{asideTitle}</h1>
              <p className="text-base leading-7 text-muted-foreground xl:text-lg">{asideDescription}</p>
            </div>
          </div>
          <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
            <div className="rounded-xl border bg-background/80 p-4">
              Full-width layouts for patient and provider workflows.
            </div>
            <div className="rounded-xl border bg-background/80 p-4">
              Responsive booking, messaging, and dashboard navigation.
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
          <div className="w-full">
            <div className="mx-auto w-full max-w-xl space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary lg:hidden">{eyebrow}</p>
                <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
              <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">{children}</div>
              {footer && <div className="text-sm text-muted-foreground">{footer}</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
