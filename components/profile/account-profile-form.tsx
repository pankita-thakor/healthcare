"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCurrentAccountProfile, saveCurrentAccountProfile, type AccountProfile } from "@/services/profile/service";

export function AccountProfileForm() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setError(null);
        setProfile(await fetchCurrentAccountProfile());
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
    if (!profile) return;

    setSaving(true);
    setError(null);
    setStatus("");

    try {
      await saveCurrentAccountProfile({
        fullName: profile.fullName,
        phone: profile.phone
      });
      setStatus("Profile updated successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  if (!profile) return <p className="text-sm text-destructive">{error ?? "Unable to load profile."}</p>;

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Input
        value={profile.fullName}
        onChange={(e) => setProfile((current) => (current ? { ...current, fullName: e.target.value } : current))}
        placeholder="Full name"
        required
      />
      <Input
        value={profile.phone}
        onChange={(e) => setProfile((current) => (current ? { ...current, phone: e.target.value } : current))}
        placeholder="Phone"
        required
      />
      <div className="md:col-span-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>Role: {profile.role}</span>
        <span>Status: {profile.status}</span>
      </div>
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      {status && <p className="text-sm text-emerald-600 md:col-span-2">{status}</p>}
      <div className="md:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save profile changes"}
        </Button>
      </div>
    </form>
  );
}
