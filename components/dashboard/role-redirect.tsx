"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/use-role";

export function RoleRedirect() {
  const router = useRouter();
  const role = useRole();

  useEffect(() => {
    if (!role) return;
    router.replace(`/dashboard/${role}`);
  }, [role, router]);

  return null;
}
