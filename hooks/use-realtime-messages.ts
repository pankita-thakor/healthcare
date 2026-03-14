"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

const supabase = createBrowserClient();

export function useRealtimeMessages(userId: string, peerId: string) {
  const [messages, setMessages] = useState<Array<{ id: string; content: string }>>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${userId}:${peerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as { id: string; content: string; sender_id: string; recipient_id: string };
        if (
          (msg.sender_id === userId && msg.recipient_id === peerId) ||
          (msg.sender_id === peerId && msg.recipient_id === userId)
        ) {
          setMessages((prev) => [...prev, { id: msg.id, content: msg.content }]);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [peerId, userId]);

  return messages;
}
