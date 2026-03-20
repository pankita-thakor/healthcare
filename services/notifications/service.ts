import { createBrowserClient } from "@/lib/supabase";
import { isDemoUserId } from "@/lib/demo-session";

const supabase = createBrowserClient();

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  message: string | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function fetchNotifications(userId: string, limit = 20): Promise<NotificationRecord[]> {
  if (isDemoUserId(userId)) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, title, body, type, message, read, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as NotificationRecord[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (isDemoUserId(userId)) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (isDemoUserId(userId)) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) return 0;
  return count ?? 0;
}

export function subscribeToNotifications(
  userId: string,
  onInsert: () => void,
  onUpdate?: () => void
) {
  if (isDemoUserId(userId)) {
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`
      },
      onInsert
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`
      },
      onUpdate ?? onInsert
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

export async function notifyAppointment(
  _email?: string,
  _phone?: string,
  _pushToken?: string,
  _message?: string
): Promise<void> {
  // Stub – push/email integration not implemented
}
