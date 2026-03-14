"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bookAppointment,
  fetchBookableProviderProfiles,
  fetchBookableProviderSlots,
  type BookableProviderProfile,
  type BookableProviderSlot
} from "@/services/appointments/service";
import { Button } from "@/components/ui/button";

export function AppointmentForm({ patientId, defaultProviderId = "" }: { patientId: string; defaultProviderId?: string }) {
  const [providerId, setProviderId] = useState(defaultProviderId);
  const [slotStart, setSlotStart] = useState("");
  const [slots, setSlots] = useState<BookableProviderSlot[]>([]);
  const [providerProfiles, setProviderProfiles] = useState<BookableProviderProfile[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [status, setStatus] = useState("");
  const [successPopup, setSuccessPopup] = useState<{
    providerName: string;
    slotLabel: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!successPopup) return;

    const timer = window.setTimeout(() => {
      setSuccessPopup(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [successPopup]);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
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
        setError((err as Error).message);
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
    return slots.filter((slot) => slot.provider_id === providerId);
  }, [providerId, slots]);

  const selectedProvider = useMemo(() => {
    const profile = providerProfiles.find((provider) => provider.provider_id === providerId);
    const nextSlot = availableSlots[0] ?? null;

    if (profile) {
      return {
        ...profile,
        availableSlotCount: availableSlots.length,
        nextSlot
      };
    }

    const fallbackSlot = slots.find((slot) => slot.provider_id === providerId);
    if (!fallbackSlot) return null;

    return {
      provider_id: fallbackSlot.provider_id,
      provider_name: fallbackSlot.provider_name,
      category_name: fallbackSlot.category_name,
      hospital: null,
      experience: null,
      bio: null,
      availableSlotCount: availableSlots.length,
      nextSlot
    };
  }, [availableSlots, providerId, providerProfiles, slots]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("");

    const selectedSlot = availableSlots.find((slot) => slot.slot_start === slotStart);
    if (!selectedSlot) {
      setError("Select an available slot before booking.");
      return;
    }

    await bookAppointment({
      patientId,
      providerId,
      startTime: selectedSlot.slot_start,
      endTime: selectedSlot.slot_end,
      reason: `Booked slot with ${selectedSlot.provider_name ?? "provider"}`
    });

    setStatus("Appointment requested successfully.");
    setSuccessPopup({
      providerName: selectedSlot.provider_name ?? "Provider",
      slotLabel: new Date(selectedSlot.slot_start).toLocaleString()
    });
    setSlotStart("");

    const refreshedSlots = await fetchBookableProviderSlots();
    setSlots(refreshedSlots);
    const providerIds = Array.from(new Set(refreshedSlots.map((slot) => slot.provider_id)));
    setProviderProfiles(await fetchBookableProviderProfiles(providerIds));
  }

  return (
    <div className="relative">
      {successPopup && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 max-w-sm animate-[fade-in_0.25s_ease-out]">
          <div className="rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-emerald-800 dark:bg-slate-950/95">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ✓
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Appointment booked successfully</p>
                <p className="text-sm text-muted-foreground">
                  {successPopup.providerName} on {successPopup.slotLabel}
                </p>
              </div>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950">
              <div className="h-full w-full origin-left animate-[shrink_3s_linear_forwards] rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
          className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
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
          {availableSlots.map((slot) => (
            <option key={`${slot.provider_id}-${slot.slot_start}`} value={slot.slot_start}>
              {new Date(slot.slot_start).toLocaleString()} - {new Date(slot.slot_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </option>
          ))}
        </select>

        {error && <p className="text-sm text-destructive md:col-span-3">{error}</p>}
        {status && <p className="text-sm text-emerald-600 md:col-span-3">{status}</p>}
        {!loadingSlots && !error && providerOptions.length === 0 && (
          <p className="text-sm text-muted-foreground md:col-span-3">
            No providers have open slots yet. Ask a doctor to add availability in the schedule tab.
          </p>
        )}
        {!loadingSlots && providerId && availableSlots.length === 0 && (
          <p className="text-sm text-muted-foreground md:col-span-3">No open slots for this provider right now.</p>
        )}

        {selectedProvider && (
          <div className="rounded-lg border bg-muted/20 p-4 text-sm md:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-base font-semibold">{selectedProvider.provider_name ?? "Provider"}</p>
                <p className="text-muted-foreground">
                  {selectedProvider.category_name ?? "General care"}
                  {selectedProvider.experience != null ? ` · ${selectedProvider.experience} yrs experience` : ""}
                </p>
                {selectedProvider.hospital && (
                  <p className="text-muted-foreground">{selectedProvider.hospital}</p>
                )}
              </div>
              <div className="rounded-md border bg-background px-3 py-2 text-right">
                <p className="font-medium">{selectedProvider.availableSlotCount} open slots</p>
                <p className="text-xs text-muted-foreground">
                  {selectedProvider.nextSlot
                    ? `Next: ${new Date(selectedProvider.nextSlot.slot_start).toLocaleString()}`
                    : "No future slot"}
                </p>
              </div>
            </div>
            {selectedProvider.bio && (
              <p className="mt-3 text-muted-foreground">{selectedProvider.bio}</p>
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
