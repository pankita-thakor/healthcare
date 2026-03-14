"use client";

export interface SyncedProviderSlot {
  provider_id: string;
  provider_name: string | null;
  category_name: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
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
    return !(
      item.provider_id === slot.provider_id &&
      item.day_of_week === slot.day_of_week &&
      item.start_time === slot.start_time &&
      item.end_time === slot.end_time
    );
  });

  existing.push(slot);
  existing.sort((a, b) => {
    if (a.provider_id !== b.provider_id) return a.provider_id.localeCompare(b.provider_id);
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });

  writeSyncedProviderSlots(existing);
}
