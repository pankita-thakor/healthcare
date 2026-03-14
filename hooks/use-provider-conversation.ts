"use client";

import { useEffect, useState } from "react";
import {
  getConversationMessages,
  sendConversationMessage,
  subscribeConversation
} from "@/services/provider/dashboard";

interface ConversationMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

export function useProviderConversation(conversationId: string) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  useEffect(() => {
    async function run() {
      const initial = await getConversationMessages(conversationId);
      setMessages(initial as ConversationMessage[]);
    }

    if (!conversationId) return;
    void run();

    const channel = subscribeConversation(conversationId, (payload) => {
      setMessages((prev) => [...prev, payload.new as ConversationMessage]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  async function send(recipientId: string, content: string) {
    const nextMessage = await sendConversationMessage({ conversationId, recipientId, content });
    if (!nextMessage) return;

    setMessages((prev) => {
      if (prev.some((message) => message.id === nextMessage.id)) return prev;
      return [...prev, nextMessage as ConversationMessage];
    });
  }

  return { messages, send };
}
