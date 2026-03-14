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
const LOCAL_AUTH_ACCOUNTS_KEY = "hf_local_auth_accounts";

interface LocalAuthAccount {
  email: string;
  passwordHash: string;
  role: Extract<UserRole, "patient" | "provider">;
  fullName: string;
  phone: string;
  createdAt: string;
}

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

async function hashPassword(value: string) {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return value;
  }

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readLocalAuthAccounts() {
  if (!canUseBrowserApis()) return [] as LocalAuthAccount[];

  const raw = localStorage.getItem(LOCAL_AUTH_ACCOUNTS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as LocalAuthAccount[];
  } catch {
    localStorage.removeItem(LOCAL_AUTH_ACCOUNTS_KEY);
    return [];
  }
}

function writeLocalAuthAccounts(accounts: LocalAuthAccount[]) {
  if (!canUseBrowserApis()) return;
  localStorage.setItem(LOCAL_AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
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

export async function rememberLocalAuthAccount(input: {
  email: string;
  password: string;
  role: Extract<UserRole, "patient" | "provider">;
  fullName: string;
  phone?: string;
}) {
  if (!canUseBrowserApis()) return;

  const normalizedEmail = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const nextAccount: LocalAuthAccount = {
    email: normalizedEmail,
    passwordHash,
    role: input.role,
    fullName: input.fullName.trim() || (input.role === "provider" ? "Doctor Demo" : "Patient Demo"),
    phone: input.phone?.trim() || "",
    createdAt: new Date().toISOString()
  };

  const accounts = readLocalAuthAccounts().filter((account) => account.email !== normalizedEmail);
  accounts.push(nextAccount);
  writeLocalAuthAccounts(accounts);
}

export async function getLocalAuthAccount(email: string, password: string) {
  if (!canUseBrowserApis()) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  return (
    readLocalAuthAccounts().find(
      (account) => account.email === normalizedEmail && account.passwordHash === passwordHash
    ) ?? null
  );
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
