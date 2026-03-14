"use client";

import { useEffect, useState } from "react";
import { fetchProviderDashboard, type ProviderDashboardSnapshot } from "@/services/provider/dashboard";

export function useProviderDashboard() {
  const [data, setData] = useState<ProviderDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      setData(await fetchProviderDashboard());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return { data, loading, error, refresh };
}
