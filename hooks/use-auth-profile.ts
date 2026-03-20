"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { safeGetUser } from "@/lib/supabase-auth";

const supabase = createBrowserClient();

export interface AuthProfile {
  id: string;
  role: "admin" | "provider" | "patient";
  status: string;
}

export function useAuthProfile() {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      const { user } = await safeGetUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase.from("users").select("id, role, status").eq("id", user.id).single();
      if (data) {
        setProfile(data as AuthProfile);
      }
      setLoading(false);
    }

    void run();
  }, []);

  return { profile, loading };
}
