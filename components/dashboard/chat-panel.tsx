"use client";

import { useEffect, useState } from "react";
import { subscribeToMessages, sendMessage } from "@/services/messages/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
}

export function ChatPanel({ userId, peerId }: { userId: string; peerId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    const channel = subscribeToMessages(userId, peerId, (payload) => {
      setMessages((prev) => [...prev, payload.new as ChatMessage]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [peerId, userId]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    await sendMessage({ senderId: userId, recipientId: peerId, content: value });
    setValue("");
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="max-h-64 space-y-2 overflow-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded bg-muted p-2 text-sm">{msg.content}</div>
        ))}
      </div>
      <form onSubmit={onSend} className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type message" />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
