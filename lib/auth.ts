import { cookies } from "next/headers";

export function getRoleFromCookie(): "patient" | "provider" | "admin" | null {
  const role = cookies().get("hf_role")?.value;
  if (role === "patient" || role === "provider" || role === "admin") {
    return role;
  }
  return null;
}
