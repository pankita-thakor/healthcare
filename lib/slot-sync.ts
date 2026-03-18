"use client";

export interface SyncedProviderSlot {
  provider_id: string;
  provider_name: string | null;
  category_name: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  specific_date?: string;
}

const STORAGE_KEY = "healthflow-provider-slots";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readSyncedProviderSlots(): SyncedProviderSlot[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncedProviderSlot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSyncedProviderSlots(slots: SyncedProviderSlot[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

export function upsertSyncedProviderSlot(slot: SyncedProviderSlot) {
  const existing = readSyncedProviderSlots().filter((item) => {
    const sameKey =
      item.provider_id === slot.provider_id &&
      item.start_time === slot.start_time &&
      item.end_time === slot.end_time;
    const sameDateOrDay = slot.specific_date
      ? item.specific_date === slot.specific_date
      : !item.specific_date && item.day_of_week === slot.day_of_week;
    return !(sameKey && sameDateOrDay);
  });

  existing.push(slot);
  existing.sort((a, b) => {
    if (a.provider_id !== b.provider_id) return a.provider_id.localeCompare(b.provider_id);
    const aKey = a.specific_date ?? String(a.day_of_week);
    const bKey = b.specific_date ?? String(b.day_of_week);
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return a.start_time.localeCompare(b.start_time);
  });

  writeSyncedProviderSlots(existing);
}

export function removeSyncedProviderSlot(slot: Pick<SyncedProviderSlot, "provider_id" | "day_of_week" | "start_time" | "end_time"> & { specific_date?: string }) {
  const remaining = readSyncedProviderSlots().filter((item) => {
    const sameKey =
      item.provider_id === slot.provider_id &&
      item.start_time === slot.start_time &&
      item.end_time === slot.end_time;
    const sameDateOrDay = slot.specific_date
      ? item.specific_date === slot.specific_date
      : !item.specific_date && item.day_of_week === slot.day_of_week;
    return !(sameKey && sameDateOrDay);
  });

  writeSyncedProviderSlots(remaining);
}
