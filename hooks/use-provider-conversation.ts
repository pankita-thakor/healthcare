"use client";

import { useState } from "react";

interface ConversationMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

/** Chat logic removed – UI only. Returns empty messages and no-op send. */
export function useProviderConversation(_conversationId: string) {
  const [messages] = useState<ConversationMessage[]>([]);

  async function send(_recipientId: string, _content: string) {
    // no-op
  }

  return { messages, send };
}
