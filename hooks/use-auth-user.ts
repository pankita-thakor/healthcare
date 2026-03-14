"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

const supabase = createBrowserClient();

export function useAuthUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  return userId;
}
