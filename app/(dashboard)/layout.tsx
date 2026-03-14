import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <p className="font-semibold">HealthFlow Dashboard</p>
          <div className="flex items-center gap-3">
            <DashboardNav />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <section className="container py-8">{children}</section>
    </main>
  );
}
