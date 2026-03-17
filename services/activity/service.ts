"use client";

import { getClientUserId } from "@/lib/client-auth";

const ACTIVITY_LOG_KEY = "hf_activity_log";

export interface ActivityRecord {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  type: "appointment" | "message" | "profile" | "clinical" | "availability";
}

export function logActivity(action: string, details: string, type: ActivityRecord["type"] = "appointment") {
  if (typeof window === "undefined") return;
  
  const userId = getClientUserId() || "anonymous";
  const records = fetchActivities();
  
  const newRecord: ActivityRecord = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
    type
  };
  
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify([newRecord, ...records].slice(0, 100)));
}

export function fetchActivities(): ActivityRecord[] {
  if (typeof window === "undefined") return [];
  
  const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
  if (!raw) return [];
  
  try {
    return JSON.parse(raw) as ActivityRecord[];
  } catch {
    return [];
  }
}

export function fetchActivitiesByUser(userId: string): ActivityRecord[] {
  return fetchActivities().filter(a => a.userId === userId);
}
