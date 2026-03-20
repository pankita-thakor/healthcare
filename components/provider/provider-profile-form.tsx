"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProviderCategories } from "@/hooks/use-provider-categories";
import {
  fetchCurrentProviderProfileDetails,
  saveCurrentProviderProfileDetails,
  type ProviderProfileDetails
} from "@/services/provider/dashboard";

export function ProviderProfileForm({ onSaved }: { onSaved?: () => void | Promise<void> }) {
  const { categories, loading: loadingCategories } = useProviderCategories();

  const [form, setForm] = useState<ProviderProfileDetails>({
    name: "",
    phone: "",
    licenseNumber: "",
    categoryId: "",
    experience: "",
    hospital: "",
    bio: "",
    availability: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const data = await fetchCurrentProviderProfileDetails();
        setForm(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void run();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("");
    setSaving(true);
    try {
      await saveCurrentProviderProfileDetails(form);
      setStatus("Profile saved successfully.");
      await onSaved?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading profile form...</p>;

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" required />
      <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" required />
      <Input
        value={form.licenseNumber}
        onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
        placeholder="License number"
        required
      />
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={form.categoryId}
        onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
        disabled={loadingCategories}
        required
      >
        <option value="">{loadingCategories ? "Loading categories..." : "Select specialization category"}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <Input
        type="number"
        min="0"
        value={form.experience}
        onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
        placeholder="Experience (years)"
      />
      <Input value={form.hospital} onChange={(e) => setForm((p) => ({ ...p, hospital: e.target.value }))} placeholder="Hospital" required />
      <Textarea
        className="md:col-span-2"
        value={form.bio}
        onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
        placeholder="Bio"
        required
      />
      <Textarea
        className="md:col-span-2"
        value={form.availability}
        onChange={(e) => setForm((p) => ({ ...p, availability: e.target.value }))}
        placeholder="Availability (days/hours)"
        required
      />

      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      {status && <p className="text-sm text-emerald-600 md:col-span-2">{status}</p>}
      <div className="md:col-span-2">
        <Button type="submit" disabled={saving || loadingCategories}>
          {saving ? "Saving..." : "Save Provider Details"}
        </Button>
      </div>
    </form>
  );
}
