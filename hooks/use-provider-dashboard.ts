"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchProviderDashboard, type ProviderDashboardSnapshot } from "@/services/provider/dashboard";
import { createBrowserClient } from "@/lib/supabase";
import { safeGetUser } from "@/lib/supabase-auth";

export function useProviderDashboard() {
  const [data, setData] = useState<ProviderDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setData(await fetchProviderDashboard());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void safeGetUser().then(({ user }) => {
      if (!user?.id) return;
      channel = supabase
        .channel("provider-dashboard-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointments", filter: `provider_id=eq.${user.id}` },
          () => void refresh()
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
