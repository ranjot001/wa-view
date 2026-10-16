"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, ConversationStatus, Message } from "@/lib/types";

// Subscribes to new messages + conversation status for one conversation.
// Keeps a de-duplicated, chronologically sorted message list.
export function useRealtimeMessages(
  supabase: SupabaseClient,
  conversationId: string,
  initial: Message[],
  initialStatus: ConversationStatus
) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [status, setStatus] = useState<ConversationStatus>(initialStatus);
  const idset = useRef<Set<string>>(new Set(initial.map((m) => m.id)));

  const upsert = (m: Message) => {
    setMessages((prev) => {
      if (idset.current.has(m.id)) {
        return prev.map((x) => (x.id === m.id ? { ...x, ...m } : x));
      }
      idset.current.add(m.id);
      return [...prev, m].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  };

  useEffect(() => {
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => upsert(payload.new as Message)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => upsert(payload.new as Message)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${conversationId}` },
        (payload) => setStatus((payload.new as Conversation).status)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return { messages, upsert, status, setStatus };
}
