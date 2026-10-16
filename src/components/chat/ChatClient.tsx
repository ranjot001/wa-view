"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadChatMedia } from "@/lib/upload";
import type { Conversation, Message } from "@/lib/types";
import { ChatHeader } from "./ChatHeader";
import { InstallBanner } from "./InstallBanner";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { useRealtimeMessages } from "./useRealtimeMessages";

export function ChatClient({
  conversation,
  initialMessages,
}: {
  conversation: Conversation;
  initialMessages: Message[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const { messages, upsert, status } = useRealtimeMessages(
    supabase,
    conversation.id,
    initialMessages,
    conversation.status
  );
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);

  // Clear the "bot is typing" indicator once a bot/admin reply lands.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.sender_type !== "user") setTyping(false);
  }, [messages]);

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conversation.id, ...payload }),
    });
    if (!res.ok) {
      setTyping(false);
      const { error } = await res.json().catch(() => ({ error: "Failed to send" }));
      alert(error || "Failed to send message");
      return;
    }
    const data = (await res.json()) as { userMessage?: Message; botMessage?: Message };
    if (data.userMessage) upsert(data.userMessage);
    if (data.botMessage) upsert(data.botMessage);
  }

  async function sendText(body: string) {
    if (status === "bot") setTyping(true);
    await post({ body });
  }

  async function sendMedia(file: Blob) {
    setBusy(true);
    try {
      const { url, mediaType } = await uploadChatMedia(supabase, conversation.id, file);
      if (status === "bot") setTyping(true);
      await post({ mediaUrl: url, mediaType });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col bg-white shadow-xl">
      <ChatHeader status={status} />
      <InstallBanner />
      <MessageList messages={messages} mineSide="user" typing={typing} />
      <Composer
        onSendText={sendText}
        onSendFile={sendMedia}
        onSendVoice={sendMedia}
        disabled={busy || status === "closed"}
        placeholder={status === "closed" ? "This chat is closed" : "Type a message…"}
      />
    </div>
  );
}
