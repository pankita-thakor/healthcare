"use client";

import { useEffect } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/use-role";

export function RoleRedirect() {
  const router = useRouter();
  const role = useRole();

  useEffect(() => {
    if (!role) return;
    router.replace(`/dashboard/${role}` as Route);
  }, [role, router]);

  return null;
}
