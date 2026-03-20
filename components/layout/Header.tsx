"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, HeartPulse, MessageSquare } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { logout } from "@/services/auth/service";
import { getClientRole, getClientUserId } from "@/lib/client-auth";
import { getDemoSessionByUserId } from "@/lib/demo-session";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  type NotificationRecord
} from "@/services/notifications/service";

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
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const refreshNotifications = useCallback(async () => {
    const userId = getClientUserId();
    if (!userId) return;
    const demoSession = getDemoSessionByUserId(userId);
    if (demoSession) return;
    const list = await fetchNotifications(userId);
    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.read).length);
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();
    const userId = getClientUserId();
    let cancelled = false;
    let sub: { unsubscribe: () => void } = { unsubscribe: () => {} };

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

        const list = await fetchNotifications(userId);
        if (!cancelled) {
          setNotifications(list);
          setUnreadCount(list.filter((n) => !n.read).length);
        }

        sub = subscribeToNotifications(userId, () => {
          if (!cancelled) void fetchNotifications(userId).then((list) => {
            if (!cancelled) {
              setNotifications(list);
              setUnreadCount(list.filter((n) => !n.read).length);
            }
          });
        });
      } catch (err) {
        if (err instanceof DOMException) return;
      }
    }

    void load();

    return () => {
      cancelled = true;
      sub.unsubscribe();
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
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-[100%] items-center justify-between px-4 md:px-8">
        <button
          type="button"
          onClick={() => router.push(dashboardPath)}
          className="group flex items-center gap-2.5 transition-transform"
          aria-label="Go to dashboard"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#11927d] text-white shadow-lg shadow-[#3b82f6]/20 group-hover:rotate-12 transition-transform duration-300">
             <HeartPulse className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-black tracking-tighter">
            <span className="text-foreground">Healthy</span><span className="text-[#11927d]">fy</span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const next = !notifOpen;
                setNotifOpen(next);
                if (next) void refreshNotifications();
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
              title="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-destructive shadow-[0_0_0_2px_white] dark:shadow-[0_0_0_2px_black]" />
              )}
            </button>
            {notifOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 max-h-[min(24rem,70vh)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      const uid = getClientUserId();
                      if (uid) await markAllNotificationsRead(uid);
                      setUnreadCount(0);
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[min(20rem,60vh)]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href="/dashboard/activity"
                      onClick={() => {
                        setNotifOpen(false);
                        if (!n.read) {
                          markNotificationRead(n.id);
                          setUnreadCount((c) => Math.max(0, c - 1));
                          setNotifications((prev) =>
                            prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                          );
                        }
                      }}
                      className={`flex gap-3 p-3 border-b border-border/40 last:border-0 transition-colors hover:bg-muted/50 ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="shrink-0 h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {new Date(n.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-2" />
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />

          <ThemeToggle />

          <details className="relative group/details">
            <summary className="list-none cursor-pointer rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-sm font-bold text-foreground transition-all hover:bg-muted">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-black">
                   {fullName.slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{fullName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </summary>
            <div className="absolute right-0 mt-3 w-56 origin-top-right overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-border dark:bg-card/95">
              <div className="px-3 py-2.5 mb-1 border-b border-border">
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Account</p>
                 <p className="text-sm font-bold truncate text-foreground">{fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(profilePath as never)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-all hover:bg-muted hover:text-foreground dark:hover:bg-white/10"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                Profile Settings
              </button>
              <button
                type="button"
                onClick={() => router.push(settingsPath as never)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-all hover:bg-muted hover:text-foreground dark:hover:bg-white/10"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                Security
              </button>
              <div className="my-1 h-px bg-border" />
              <button 
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-destructive dark:text-red-400 transition-all hover:bg-destructive/10 hover:text-destructive dark:hover:bg-red-500/20 dark:hover:text-red-300"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 dark:bg-red-500/20">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </div>
                Sign Out
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
