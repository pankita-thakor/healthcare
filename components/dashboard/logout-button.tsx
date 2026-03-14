"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth/service";

export function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <Button variant="outline" onClick={onLogout}>
      Logout
    </Button>
  );
}
