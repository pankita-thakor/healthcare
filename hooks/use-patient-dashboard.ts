"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchPatientDashboard, type PatientDashboardSnapshot } from "@/services/patient/dashboard";
import { createBrowserClient } from "@/lib/supabase";
import { safeGetUser } from "@/lib/supabase-auth";

export function usePatientDashboard() {
  const [data, setData] = useState<PatientDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setData(await fetchPatientDashboard());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const supabase = createBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void safeGetUser().then(({ user }) => {
      if (!user?.id) return;
      channel = supabase
        .channel("patient-appointments-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments",
            filter: `patient_id=eq.${user.id}`,
          },
          () => void refetch()
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [refetch]);

  useEffect(() => {
    const id = setInterval(() => void refetch(), 60_000);
    return () => clearInterval(id);
  }, [refetch]);

  return { data, loading, error, refetch };
}
