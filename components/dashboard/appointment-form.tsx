"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bookAppointment,
  fetchBookableProviderProfiles,
  fetchBookableProviderSlots,
  getDisplayFallbackForProvider,
  type BookableProviderProfile,
  type BookableProviderSlot
} from "@/services/appointments/service";
import { Button } from "@/components/ui/button";
import { showNotification } from "@/components/layout/GlobalNotification";

const DISPLAY_FALLBACKS: Record<string, { category_description: string; hospital: string; experience: number; bio: string }> = {
  Cardiology: {
    category_description: "Heart and cardiovascular care",
    hospital: "Healthyfy Care Center",
    experience: 8,
    bio: "Focuses on preventive heart care, follow-up plans, and virtual consultations."
  },
  Dermatology: {
    category_description: "Skin, hair, and nail care",
    hospital: "Sunrise Clinic",
    experience: 6,
    bio: "Supports skin-care reviews, treatment planning, and quick follow-up consultations."
  },
  "General Medicine": {
    category_description: "Primary and preventive care",
    hospital: "Metro Health Hub",
    experience: 10,
    bio: "Handles routine checkups, fever/cough consultations, and long-term wellness guidance."
  },
  "General care": {
    category_description: "Primary and preventive care",
    hospital: "Metro Health Hub",
    experience: 10,
    bio: "Handles routine checkups, fever/cough consultations, and long-term wellness guidance."
  }
};

export function AppointmentForm({ patientId, defaultProviderId = "" }: { patientId: string; defaultProviderId?: string }) {
  const [providerId, setProviderId] = useState(defaultProviderId);
  const [slotStart, setSlotStart] = useState("");
  const [slots, setSlots] = useState<BookableProviderSlot[]>([]);
  const [providerProfiles, setProviderProfiles] = useState<BookableProviderProfile[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const upcomingSlots = await fetchBookableProviderSlots();
        setSlots(upcomingSlots);
        const providerIds = Array.from(new Set(upcomingSlots.map((slot) => slot.provider_id)));
        setProviderProfiles(await fetchBookableProviderProfiles(providerIds));
        if (!defaultProviderId && upcomingSlots[0]?.provider_id) {
          setProviderId(upcomingSlots[0].provider_id);
        }
      } catch (err) {
        setSlots([]);
        setProviderProfiles([]);
        showNotification((err as Error).message, "error");
      } finally {
        setLoadingSlots(false);
      }
    }

    void load();
  }, [defaultProviderId]);

  const providerOptions = useMemo(() => {
    const uniqueProviders = new Map<string, { id: string; label: string }>();
    for (const slot of slots) {
      if (!uniqueProviders.has(slot.provider_id)) {
        uniqueProviders.set(slot.provider_id, {
          id: slot.provider_id,
          label: `${slot.provider_name ?? "Provider"}${slot.category_name ? ` · ${slot.category_name}` : ""}`
        });
      }
    }
    return Array.from(uniqueProviders.values());
  }, [slots]);

  const availableSlots = useMemo(() => {
    const filtered = slots.filter((slot) => slot.provider_id === providerId);
    return [...filtered].sort((a, b) => a.slot_start.localeCompare(b.slot_start));
  }, [providerId, slots]);

  const selectedProvider = useMemo(() => {
    const profile = providerProfiles.find((provider) => provider.provider_id === providerId);
    const slotForProvider = slots.find((slot) => slot.provider_id === providerId);
    const nextSlot = availableSlots[0] ?? null;

    // Always prefer slot data for provider_name and category_name (RPC has full access; profile fetch may fail due to RLS)
    const provider_name = slotForProvider?.provider_name ?? profile?.provider_name ?? "Provider";
    const category_name = slotForProvider?.category_name ?? profile?.category_name ?? "General care";

    let base: {
      provider_id: string;
      provider_name: string;
      category_name: string;
      category_description: string | null;
      hospital: string | null;
      phone: string | null;
      experience: number | null;
      bio: string | null;
      availableSlotCount: number;
      nextSlot: (typeof availableSlots)[0] | null;
    };

    if (profile) {
      base = {
        ...profile,
        provider_name,
        category_name,
        availableSlotCount: availableSlots.length,
        nextSlot
      };
    } else if (slotForProvider) {
      base = {
        provider_id: slotForProvider.provider_id,
        provider_name,
        category_name,
        category_description: null,
        hospital: null,
        phone: null,
        experience: null,
        bio: null,
        availableSlotCount: availableSlots.length,
        nextSlot
      };
    } else {
      return null;
    }

    // Merge display fallback when profile has sparse or empty data (no hospital, bio, etc.)
    const fallback =
      getDisplayFallbackForProvider(providerId, provider_name, category_name) ??
      (() => {
        const key = Object.keys(DISPLAY_FALLBACKS).find((k) => k.toLowerCase() === (category_name ?? "").toLowerCase());
        return key ? DISPLAY_FALLBACKS[key] : null;
      })();
    if (fallback) {
      const trimOrNull = (v: string | null | undefined) => (v && String(v).trim()) || null;
      return {
        ...base,
        category_description: trimOrNull(base.category_description) ?? fallback.category_description,
        hospital: trimOrNull(base.hospital) ?? fallback.hospital,
        experience: base.experience != null && base.experience > 0 ? base.experience : fallback.experience,
        bio: trimOrNull(base.bio) ?? fallback.bio
      };
    }
    return base;
  }, [availableSlots, providerId, providerProfiles, slots]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const selectedSlot = availableSlots.find((slot) => slot.slot_start === slotStart);
    if (!selectedSlot) {
      showNotification("Select an available slot before booking.", "error");
      return;
    }

    try {
      await bookAppointment({
        patientId,
        providerId,
        startTime: selectedSlot.slot_start,
        endTime: selectedSlot.slot_end,
        reason: `Booked slot with ${selectedSlot.provider_name ?? "provider"}`
      });

      showNotification(`Appointment booked with ${selectedSlot.provider_name ?? "Provider"}!`);
      setSlotStart("");

      const refreshedSlots = await fetchBookableProviderSlots();
      setSlots(refreshedSlots);
      const providerIds = Array.from(new Set(refreshedSlots.map((slot) => slot.provider_id)));
      setProviderProfiles(await fetchBookableProviderProfiles(providerIds));
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  }

  return (
    <div className="relative">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3">
        <select
          className="h-12 rounded-xl border border-input bg-background px-3 text-sm"
          value={providerId}
          onChange={(e) => {
            setProviderId(e.target.value);
            setSlotStart("");
          }}
          disabled={loadingSlots}
          required
        >
          <option value="">{loadingSlots ? "Loading providers..." : "Select provider"}</option>
          {providerOptions.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>

        <select
          className="h-12 rounded-xl border border-input bg-background px-3 text-sm md:col-span-2"
          value={slotStart}
          onChange={(e) => setSlotStart(e.target.value)}
          disabled={loadingSlots || !providerId}
          required
        >
          <option value="">
            {loadingSlots
              ? "Loading slots..."
              : providerId
                ? "Select available slot"
                : "Choose a provider first"}
          </option>
          {availableSlots.map((slot) => {
            const start = slot.slot_start ? new Date(slot.slot_start) : null;
            const end = slot.slot_end ? new Date(slot.slot_end) : null;
            const label = start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())
              ? `${start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · ${start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })} – ${end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}`
              : "Invalid slot";
            return (
              <option key={`${slot.slot_id ?? slot.provider_id}-${slot.slot_start}`} value={slot.slot_start}>
                {label}
              </option>
            );
          })}
        </select>

        {!loadingSlots && providerOptions.length === 0 && (
          <p className="text-sm text-muted-foreground md:col-span-3">
            No providers have open slots yet. Ask a doctor to add availability in the schedule tab.
          </p>
        )}
        {!loadingSlots && providerId && availableSlots.length === 0 && (
          <p className="text-sm text-muted-foreground md:col-span-3">No open slots for this provider right now.</p>
        )}

        {selectedProvider && (
          <div className="rounded-2xl border bg-muted/20 p-6 text-sm md:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2 min-w-0 flex-1">
                <p className="text-base font-bold">{selectedProvider.provider_name ?? "Provider"}</p>
                <p className="text-muted-foreground font-medium">
                  {selectedProvider.category_name ?? "General care"}
                  {selectedProvider.experience != null && selectedProvider.experience > 0 ? ` · ${selectedProvider.experience} yrs experience` : ""}
                </p>
                {selectedProvider.category_description && (
                  <p className="text-muted-foreground text-xs">{selectedProvider.category_description}</p>
                )}
                {selectedProvider.hospital && (
                  <p className="text-muted-foreground font-medium">
                    <span className="font-semibold">Hospital / Clinic:</span> {selectedProvider.hospital}
                  </p>
                )}
              </div>
              <div className="rounded-xl border bg-background px-4 py-2 text-right shadow-sm shrink-0">
                <p className="font-black text-primary">{selectedProvider.availableSlotCount} open slots</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                  {selectedProvider.nextSlot
                    ? `Next: ${new Date(selectedProvider.nextSlot.slot_start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`
                    : "No future slot"}
                </p>
              </div>
            </div>
            {selectedProvider.bio && (
              <p className="mt-4 text-muted-foreground leading-relaxed italic">{selectedProvider.bio}</p>
            )}
          </div>
        )}

        <div className="md:col-span-3">
          <Button type="submit" disabled={loadingSlots || !providerId || !slotStart}>Book appointment</Button>
        </div>
      </form>
    </div>
  );
}
