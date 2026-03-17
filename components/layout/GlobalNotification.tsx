"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type NotificationType = "success" | "error" | "info";

export interface NotificationEventDetail {
  message: string;
  type: NotificationType;
}

export function showNotification(message: string, type: NotificationType = "success") {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<NotificationEventDetail>("show-notification", {
    detail: { message, type }
  });
  window.dispatchEvent(event);
}

export function GlobalNotification() {
  const [notification, setNotification] = useState<NotificationEventDetail | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationEventDetail>;
      setNotification(customEvent.detail);
      setIsVisible(true);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    };

    window.addEventListener("show-notification", handleNotification);
    return () => window.removeEventListener("show-notification", handleNotification);
  }, []);

  if (!notification) return null;

  const bgClasses = {
    success: "bg-emerald-600 border-emerald-400 shadow-emerald-500/20",
    error: "bg-destructive border-destructive/50 shadow-destructive/20",
    info: "bg-primary border-primary/50 shadow-primary/20"
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 z-[100] w-full max-w-md -translate-x-1/2 px-4 transition-all duration-500 ease-out",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-4 text-white shadow-2xl backdrop-blur-md",
          bgClasses[notification.type]
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
          {notification.type === "success" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {notification.type === "error" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {notification.type === "info" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-black tracking-tight leading-tight uppercase opacity-70 mb-0.5">
             {notification.type}
          </p>
          <p className="text-sm font-bold leading-tight">{notification.message}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="rounded-lg p-1 transition-colors hover:bg-white/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
