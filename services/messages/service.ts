import { createBrowserClient } from "@/lib/supabase";
import { logActivity } from "@/services/activity/service";
import { isDemoUserId } from "@/lib/demo-session";

const supabase = createBrowserClient();
const DEMO_MESSAGES_KEY = "hf_demo_messages";

export function subscribeToMessages(userId: string, peerId: string, onMessage: (payload: any) => void) {
  if (isDemoUserId(userId) || isDemoUserId(peerId)) {
    return { unsubscribe() {} };
  }
  return supabase
    .channel(`messages:${userId}:${peerId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `sender_id=in.(${userId},${peerId})`
      },
      onMessage
    )
    .subscribe();
}

export async function sendMessage(input: { senderId: string; recipientId: string; content: string }) {
  const isDemo = isDemoUserId(input.senderId) || isDemoUserId(input.recipientId);

  if (isDemo) {
    const nextMessage = {
      id: `demo-message-${Date.now()}`,
      sender_id: input.senderId,
      recipient_id: input.recipientId,
      content: input.content,
      created_at: new Date().toISOString()
    };

    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(DEMO_MESSAGES_KEY);
      const messages = raw ? JSON.parse(raw) : [];
      localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify([...messages, nextMessage]));
    }
    
    logActivity("Sent Message", `Demo: Message to ${input.recipientId}`, "message");
    return;
  }

  try {
    const { error } = await supabase.from("messages").insert({
      sender_id: input.senderId,
      recipient_id: input.recipientId,
      content: input.content
    });

    if (error) throw error;
    logActivity("Sent Message", `Message to ${input.recipientId}`, "message");
  } catch (err) {
    // Fallback for foreign key / uuid errors in hackathon environment
    const msg = {
      id: `fallback-message-${Date.now()}`,
      sender_id: input.senderId,
      recipient_id: input.recipientId,
      content: input.content,
      created_at: new Date().toISOString()
    };
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(DEMO_MESSAGES_KEY);
      const messages = raw ? JSON.parse(raw) : [];
      localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify([...messages, msg]));
    }
    logActivity("Sent Message", `Local: Message to ${input.recipientId}`, "message");
  }
}

