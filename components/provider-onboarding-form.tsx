"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProviderCategories } from "@/hooks/use-provider-categories";
import { completeProviderOnboarding } from "@/services/onboarding/service";

export function ProviderOnboardingForm() {
  const router = useRouter();
  const { categories, loading } = useProviderCategories();

  const [categoryId, setCategoryId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [availability, setAvailability] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Please select a specialization category.");
      return;
    }

    const selectedCategory = categories.find((item) => item.id === categoryId);
    if (!selectedCategory) {
      setError("Selected specialization category is invalid. Refresh and try again.");
      return;
    }

    try {
      await completeProviderOnboarding({
        categoryId,
        categoryName: selectedCategory.name,
        licenseNumber,
        availability
      });
      router.push("/dashboard/provider");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        disabled={loading}
        required
      >
        <option value="">{loading ? "Loading specializations..." : "Select specialization category"}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="License number" required />
      <Textarea value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Availability (days/hours)" required />

      {!loading && categories.length === 0 && (
        <p className="text-sm text-destructive">
          No specialization categories found. Run the latest migration to seed provider categories.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || categories.length === 0}>Complete onboarding</Button>
    </form>
  );
}
