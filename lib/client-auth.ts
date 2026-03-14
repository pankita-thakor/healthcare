"use client";

export type ClientRole = "patient" | "provider" | "admin";

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")[1] ?? null;
}

export function getClientUserId() {
  return readCookie("hf_user");
}

export function getClientRole(): ClientRole | null {
  const role = readCookie("hf_role");
  if (role === "patient" || role === "provider" || role === "admin") {
    return role;
  }

  return null;
}
