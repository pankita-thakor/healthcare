"use client";

import { useEffect, useState } from "react";
import { safeGetUser } from "@/lib/supabase-auth";

export function useAuthUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    safeGetUser().then(({ user }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  return userId;
}
