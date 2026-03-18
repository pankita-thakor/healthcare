"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { getClientRole } from "@/lib/client-auth";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { GlobalNotification } from "@/components/layout/GlobalNotification";
import { usePageLoader } from "@/components/layout/CreativeLoader";

type Role = "patient" | "provider" | "admin";
type NavLink = { href: Route; label: string };

function roleLinks(role: Role | null): NavLink[] {
  if (role === "patient") {
    return [
      { href: "/dashboard/patient", label: "Overview" },
      { href: "/dashboard/activity", label: "Activity" }
    ];
  }

  if (role === "provider") {
    return [
      { href: "/dashboard/provider", label: "Overview" },
      { href: "/dashboard/provider/patients", label: "Patients" },
      { href: "/dashboard/provider/schedule", label: "Schedule" },
      { href: "/dashboard/activity", label: "Activity" }
    ];
  }

  if (role === "admin") {
    return [
      { href: "/dashboard/admin", label: "Overview" }
    ];
  }

  return [{ href: "/dashboard", label: "Dashboard" }];
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);
  const { setLoading } = usePageLoader();

  useEffect(() => {
    const cookieRole = getClientRole();
    if (cookieRole) {
      setRole(cookieRole);
      return;
    }

    const supabase = createBrowserClient();
    let cancelled = false;

    async function loadRole() {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
        if (!cancelled && profile?.role) {
          setRole(profile.role as Role);
        }
      } catch (err) {
        if (err instanceof DOMException) return;
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  const links = roleLinks(role);

  return (
    <div className="min-h-screen bg-background">
      <GlobalNotification />
      <Header />
      <div className="flex w-full items-start">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r bg-muted/20 px-5 py-6 md:block">
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Navigation</p>
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={String(link.href)}
                href={link.href as Route}
                onClick={() => setLoading(true)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm",
                  pathname === link.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 md:px-6 md:py-6 xl:px-8">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {links.map((link) => (
              <Link
                key={String(link.href)}
                href={link.href as Route}
                onClick={() => setLoading(true)}
                className={cn(
                  "whitespace-nowrap rounded-md border px-3 py-2 text-sm",
                  pathname === link.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
