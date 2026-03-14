"use client";

import { useEffect, useState } from "react";
import { fetchProviderPatientProfile, type ProviderPatientProfile } from "@/services/provider/dashboard";

export function useProviderPatientProfile(patientId: string) {
  const [profile, setProfile] = useState<ProviderPatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setProfile(await fetchProviderPatientProfile(patientId));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      void run();
    }
  }, [patientId]);

  return { profile, loading, error };
}
