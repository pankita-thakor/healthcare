"use client";

import { useEffect, useState } from "react";
import { fetchProviderCategories, type ProviderCategory } from "@/services/provider/dashboard";

export function useProviderCategories() {
  const [categories, setCategories] = useState<ProviderCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        setCategories(await fetchProviderCategories());
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    void run();
  }, []);

  return { categories, loading };
}
