"use client";

import { useEffect, useState } from "react";
import { fetchProviderPatients, type ProviderPatientListItem } from "@/services/provider/dashboard";

export function useProviderPatients() {
  const [patients, setPatients] = useState<ProviderPatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setPatients(await fetchProviderPatients());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void run();
  }, []);

  return { patients, loading, error };
}
