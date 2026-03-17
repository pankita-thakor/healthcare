"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeToMessages, sendMessage } from "@/services/messages/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showNotification } from "@/components/layout/GlobalNotification";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at?: string;
}

export function ChatPanel({ userId, peerId, peerName }: { userId: string; peerId: string; peerName?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initial load for demo messages
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("hf_demo_messages");
      if (raw) {
        try {
          const allDemo = JSON.parse(raw) as ChatMessage[];
          const relevant = allDemo.filter(
            (m) =>
              (m.sender_id === userId && m.recipient_id === peerId) ||
              (m.sender_id === peerId && m.recipient_id === userId)
          );
          setMessages(relevant);
        } catch (e) {
          console.error("Failed to parse demo messages", e);
        }
      }
    }

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
    try {
      await sendMessage({ senderId: userId, recipientId: peerId, content: value });
      
      // Optimistic update for demo/local flow
      const nextMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        content: value,
        sender_id: userId,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, nextMsg]);
      
      showNotification(`Message sent to ${peerName || "recipient"}.`);
      setValue("");
    } catch (err) {
      showNotification("Failed to send message.", "error");
    }
  }

  return (
    <div className="flex flex-col h-[400px] rounded-2xl border bg-background overflow-hidden shadow-sm">
      <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
         <h3 className="text-sm font-bold tracking-tight">Direct Conversation</h3>
         <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Secure Channel</span>
         </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
             <div className="h-10 w-10 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
             </div>
             <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-bottom-2",
              msg.sender_id === userId 
                ? "ml-auto bg-primary text-primary-foreground rounded-tr-none" 
                : "mr-auto bg-muted text-foreground rounded-tl-none"
            )}
          >
            {msg.content}
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t bg-muted/10">
        <form onSubmit={onSend} className="flex gap-2">
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            placeholder="Write your message..." 
            className="rounded-xl bg-background border-none h-11 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
          <Button type="submit" className="rounded-xl px-5 h-11 font-bold shadow-lg shadow-primary/20">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
