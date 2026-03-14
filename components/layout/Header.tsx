"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { logout } from "@/services/auth/service";
import { getClientRole, getClientUserId } from "@/lib/client-auth";
import { getDemoSessionByUserId } from "@/lib/demo-session";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type Role = "patient" | "provider" | "admin";

function getDashboardPath(role: Role | null) {
  if (role === "patient") return "/dashboard/patient";
  if (role === "provider") return "/dashboard/provider";
  if (role === "admin") return "/dashboard/admin";
  return "/dashboard";
}

function getProfilePath(role: Role | null) {
  if (role === "patient") return "/dashboard/patient/profile";
  if (role === "provider") return "/dashboard/provider/profile";
  if (role === "admin") return "/dashboard/admin/profile";
  return "/dashboard/profile";
}

function getSettingsPath(role: Role | null) {
  return `${getProfilePath(role)}#security`;
}

export function Header() {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(() => getClientRole());
  const [unreadCount, setUnreadCount] = useState(0);
  const [fullName, setFullName] = useState("User");

  useEffect(() => {
    const supabase = createBrowserClient();
    const userId = getClientUserId();
    let cancelled = false;

    async function load() {
      try {
        if (!userId) return;

        const demoSession = getDemoSessionByUserId(userId);
        if (demoSession) {
          if (!cancelled) {
            setRole(demoSession.role as Role);
            setFullName(demoSession.fullName);
            setUnreadCount(0);
          }
          return;
        }

        const { data: profile } = await supabase
          .from("users")
          .select("role, full_name")
          .eq("id", userId)
          .single();

        if (!cancelled && profile?.role) {
          setRole(profile.role as Role);
        }
        if (!cancelled && profile?.full_name) {
          setFullName(profile.full_name);
        }

        const { data: notifications } = await supabase
          .from("notifications")
          .select("id, read")
          .eq("user_id", userId)
          .eq("read", false);

        if (!cancelled) {
          setUnreadCount(notifications?.length ?? 0);
        }
      } catch (err) {
        if (err instanceof DOMException) return;
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogout() {
    try {
      await logout();
    } finally {
      setRole(null);
      setFullName("User");
      setUnreadCount(0);
      window.location.href = "/login";
    }
  }

  const dashboardPath = getDashboardPath(role);
  const profilePath = getProfilePath(role);
  const settingsPath = getSettingsPath(role);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <button
          type="button"
          onClick={() => router.push(dashboardPath)}
          className="text-left text-lg font-semibold tracking-tight"
          aria-label="Go to dashboard"
        >
          Healthyfy
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative rounded-md border p-2 hover:bg-muted"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <ThemeToggle />

          <details className="relative">
            <summary className="list-none cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
              {fullName}
            </summary>
            <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background p-1 shadow-md">
              <button
                type="button"
                onClick={() => router.push(profilePath as never)}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => router.push(settingsPath as never)}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
              >
                Settings
              </button>
              <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
