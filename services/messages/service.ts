import { createBrowserClient } from "@/lib/supabase";

const supabase = createBrowserClient();

export function subscribeToMessages(userId: string, peerId: string, onMessage: (payload: any) => void) {
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
  const { error } = await supabase.from("messages").insert({
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    content: input.content
  });

  if (error) throw error;
}
