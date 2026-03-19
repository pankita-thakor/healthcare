"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Lock, User, Mail, Calendar, Droplets, Info, Phone } from "lucide-react";
import { fetchCurrentAccountProfile, saveCurrentAccountProfile, type AccountProfile } from "@/services/profile/service";
import { cn } from "@/lib/utils";

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
        phone: profile.phone,
        // dob, gender, bloodGroup are NOT sent here because they are read-only
        insurance: profile.insurance ?? undefined,
        medicalHistory: profile.medicalHistory ?? undefined
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
    <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Full Name
        </label>
        <Input
          value={profile.fullName}
          onChange={(e) => setProfile((current) => (current ? { ...current, fullName: e.target.value } : current))}
          placeholder="Full name"
          className="rounded-xl border-slate-200 focus:ring-primary/20"
          required
        />
      </div>

      <div className="space-y-2 group">
        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Address
        </label>
        <div className="relative">
          <Input
            value={profile.email}
            disabled
            className="rounded-xl bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed pr-10"
          />
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 px-1">
          <Info className="h-3 w-3" />
          Primary account record
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          Phone Number
        </label>
        <Input
          value={profile.phone}
          onChange={(e) => setProfile((current) => (current ? { ...current, phone: e.target.value } : current))}
          placeholder="Phone"
          className="rounded-xl border-slate-200 focus:ring-primary/20"
          required
        />
      </div>

      {profile.role === "patient" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </label>
            <div className="relative">
              <Input
                type="text"
                value={profile.dob ? new Date(profile.dob).toLocaleDateString() : "Not set"}
                disabled
                className="rounded-xl bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 px-1">
              <Info className="h-3 w-3" />
              Fixed at registration
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Gender
            </label>
            <div className="relative">
              <Input
                value={profile.gender ?? "Not specified"}
                disabled
                className="rounded-xl bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 px-1">
              <Info className="h-3 w-3" />
              Fixed at registration
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4 text-red-500" />
              Blood Group
            </label>
            <div className="relative">
              <Input
                value={profile.bloodGroup ?? "Not specified"}
                disabled
                className="rounded-xl bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 px-1">
              <Info className="h-3 w-3" />
              Fixed at registration
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Insurance Information
            </label>
            <Input
              value={profile.insurance ?? ""}
              onChange={(e) => setProfile((current) => (current ? { ...current, insurance: e.target.value } : current))}
              placeholder="Insurance provider and policy number"
              className="rounded-xl border-slate-200 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Medical History
            </label>
            <Textarea
              value={profile.medicalHistory ?? ""}
              onChange={(e) => setProfile((current) => (current ? { ...current, medicalHistory: e.target.value } : current))}
              placeholder="Detailed medical history, allergies, chronic conditions..."
              rows={4}
              className="rounded-xl border-slate-200 focus:ring-primary/20"
            />
          </div>
        </>
      )}

      <div className="md:col-span-2 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <span className="uppercase tracking-wider">Role: {profile.role}</span>
        <span className="uppercase tracking-wider">Status: {profile.status}</span>
        <span className="uppercase tracking-wider">Email: {profile.email}</span>
      </div>

      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      {status && <p className="text-sm text-emerald-600 md:col-span-2">{status}</p>}

      <div className="md:col-span-2">
        <Button type="submit" disabled={saving} className="w-full md:w-auto">
          {saving ? "Saving..." : "Save profile changes"}
        </Button>
      </div>
    </form>
  );
}
