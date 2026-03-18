"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Activity as ActivityIcon, 
  Settings,
  ChevronRight,
  LogOut,
  Bell,
  HeartPulse
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { getClientRole } from "@/lib/client-auth";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { GlobalNotification } from "@/components/layout/GlobalNotification";
import { usePageLoader } from "@/components/layout/CreativeLoader";

type Role = "patient" | "provider" | "admin";
type NavLink = { href: Route; label: string; icon: any };

function roleLinks(role: Role | null): NavLink[] {
  if (role === "patient") {
    return [
      { href: "/dashboard/patient", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/activity", label: "Activity", icon: ActivityIcon }
    ];
  }

  if (role === "provider") {
    return [
      { href: "/dashboard/provider", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/provider/patients", label: "Patients", icon: Users },
      { href: "/dashboard/provider/schedule", label: "Schedule", icon: Calendar },
      { href: "/dashboard/activity", label: "Activity", icon: ActivityIcon }
    ];
  }

  if (role === "admin") {
    return [
      { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard }
    ];
  }

  return [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];
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
        {/* Creative Desktop Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-80 shrink-0 overflow-y-auto border-r border-border/40 bg-muted/30 px-6 py-10 md:block">
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-8">
              <div className="px-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Main Navigation
                </p>
              </div>
              <nav className="space-y-2">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={String(link.href)}
                      href={link.href as Route}
                      onClick={() => !isActive && setLoading(true)}
                      className={cn(
                        "group relative flex items-center gap-3 px-4 py-4 text-sm font-bold transition-all duration-300",
                        isActive 
                          ? "text-[#3b82f6]" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {/* Unique Active Indicator Shape */}
                      {isActive && (
                        <div className="absolute inset-0 z-0 bg-[#3b82f6]/10 dark:bg-[#3b82f6]/20 rounded-[1.25rem] ring-1 ring-[#3b82f6]/20 dark:ring-[#3b82f6]/30" />
                      )}
                      
                      {/* Left Active Bar */}
                      {isActive && (
                        <div className="absolute left-0 h-6 w-1 rounded-r-full bg-[#3b82f6]" />
                      )}

                      <div className={cn(
                        "relative z-10 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                        isActive 
                          ? "bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/30" 
                          : "bg-muted text-muted-foreground group-hover:bg-background group-hover:shadow-md group-hover:text-foreground"
                      )}>
                        <link.icon className="h-5 w-5" />
                      </div>
                      
                      <span className="relative z-10 flex-1">{link.label}</span>
                      
                      {isActive && (
                        <ChevronRight className="relative z-10 h-4 w-4 text-[#3b82f6]/60" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Sidebar Widget */}
            <div className="space-y-6 pt-10 px-2">
               <div className="rounded-3xl bg-gradient-to-br from-[#3b82f6] to-[#11927d] p-6 text-white shadow-xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-lg">
                       <Bell className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/80 mb-1">Health Pulse</p>
                    <p className="text-sm font-bold text-white/90 leading-snug">System health is optimal today.</p>
                  </div>
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />
               </div>
               
               <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/10 dark:hover:bg-red-500/20 dark:hover:text-red-400 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-all group-hover:bg-destructive/10 dark:group-hover:bg-red-500/30">
                     <LogOut className="h-5 w-5" />
                  </div>
                  Sign Out
               </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
          {/* Creative Mobile Navigation */}
          <div className="mb-8 flex gap-3 overflow-x-auto pb-4 md:hidden no-scrollbar">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={String(link.href)}
                  href={link.href as Route}
                  onClick={() => !isActive && setLoading(true)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-r from-[#3b82f6] to-[#11927d] text-white shadow-lg" 
                      : "bg-card border border-border text-muted-foreground"
                  )}
                >
                  <link.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
