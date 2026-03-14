"use client";

import type { UserRole } from "@/types";

export interface DemoSession {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  isDemo: true;
}

const STORAGE_KEY = "hf_demo_session";

const DEMO_USERS: Record<string, DemoSession> = {
  "jhanvi.patel@bacancy.com": {
    id: "demo-patient-1",
    role: "patient",
    fullName: "Jhanvi Patel",
    email: "jhanvi.patel@bacancy.com",
    phone: "+91 98765 43210",
    isDemo: true
  },
  "pankita.thakor@bacancy.com": {
    id: "demo-provider-1",
    role: "provider",
    fullName: "Dr. Pankita Thakor",
    email: "pankita.thakor@bacancy.com",
    phone: "+91 99887 76655",
    isDemo: true
  }
};

function canUseBrowserApis() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function isDemoUserId(userId: string | null | undefined) {
  return Boolean(userId?.startsWith("demo-"));
}

export function getDemoSessionForEmail(email: string) {
  return DEMO_USERS[email.trim().toLowerCase()] ?? null;
}

function titleCaseWord(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function createDemoSessionForRole(role: Extract<UserRole, "patient" | "provider">, email?: string): DemoSession {
  const normalizedEmail = email?.trim().toLowerCase();
  const localPart = normalizedEmail?.split("@")[0] ?? `${role}.demo`;
  const readableName = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");

  const fullName =
    role === "provider"
      ? `Dr. ${readableName || "Provider Demo"}`
      : readableName || "Patient Demo";

  return {
    id: role === "provider" ? "demo-provider-1" : "demo-patient-1",
    role,
    fullName,
    email: normalizedEmail || `${role}.demo@local.test`,
    phone: role === "provider" ? "+91 99887 76655" : "+91 98765 43210",
    isDemo: true
  };
}

export function readDemoSession() {
  if (!canUseBrowserApis()) return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeDemoSession(session: DemoSession) {
  if (!canUseBrowserApis()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearDemoSession() {
  if (!canUseBrowserApis()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getDemoSessionByUserId(userId: string) {
  const stored = readDemoSession();
  if (stored?.id === userId) return stored;

  return Object.values(DEMO_USERS).find((session) => session.id === userId) ?? null;
}
