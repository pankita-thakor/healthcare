"use client";

import { useEffect, useState } from "react";
import { fetchPatientDashboard, type PatientDashboardSnapshot } from "@/services/patient/dashboard";

export function usePatientDashboard() {
  const [data, setData] = useState<PatientDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setData(await fetchPatientDashboard());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void run();
  }, []);

  return { data, loading, error };
}
