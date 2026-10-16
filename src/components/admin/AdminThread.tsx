"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadChatMedia } from "@/lib/upload";
import type { Conversation, ConversationStatus, Message, Profile } from "@/lib/types";
import { maskPhone } from "@/lib/format";
import { BackIcon } from "@/components/ui/Icons";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { useRealtimeMessages } from "@/components/chat/useRealtimeMessages";

const STATUS_TEXT: Record<ConversationStatus, string> = {
  bot: "Handled by bot",
  pending_human: "Waiting for an agent",
  human: "You are handling this",
  closed: "Closed",
};

export function AdminThread({
  conversation,
  customer,
  initialMessages,
}: {
  conversation: Conversation;
  customer: Profile | null;
  initialMessages: Message[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const { messages, upsert, status, setStatus } = useRealtimeMessages(
    supabase,
    conversation.id,
    initialMessages,
    conversation.status
  );
  const [busy, setBusy] = useState(false);

  async function action(a: "claim" | "release" | "close" | "reopen") {
    const res = await fetch("/api/admin/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conversation.id, action: a }),
    });
    if (res.ok) {
      const { status } = await res.json();
      setStatus(status);
    }
  }

  async function reply(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conversation.id, ...payload }),
    });
    if (!res.ok) {
      alert("Could not send");
      return;
    }
    const { message } = await res.json();
    if (message) {
      upsert(message as Message);
      setStatus("human");
    }
  }

  async function sendMedia(file: Blob) {
    setBusy(true);
    try {
      const { url, mediaType } = await uploadChatMedia(supabase, conversation.id, file);
      await reply({ mediaUrl: url, mediaType });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col bg-white">
      <header className="flex items-center gap-3 bg-[var(--wa-header)] px-3 py-2.5 text-white">
        <Link href="/admin/conversations" className="p-1"><BackIcon className="h-5 w-5" /></Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 font-semibold">
          {(customer?.phone ?? "?").slice(-2)}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-semibold">
            {customer?.display_name || maskPhone(customer?.phone)}
          </p>
          <p className="text-xs text-emerald-100/80">{STATUS_TEXT[status]}</p>
        </div>
        <div className="flex gap-1.5">
          {status !== "human" && status !== "closed" && (
            <HeaderBtn onClick={() => action("claim")}>Take over</HeaderBtn>
          )}
          {status === "human" && (
            <HeaderBtn onClick={() => action("release")}>Back to bot</HeaderBtn>
          )}
          {status === "closed" ? (
            <HeaderBtn onClick={() => action("reopen")}>Reopen</HeaderBtn>
          ) : (
            <HeaderBtn onClick={() => action("close")}>Close</HeaderBtn>
          )}
        </div>
      </header>

      <MessageList messages={messages} mineSide="admin" />

      {status === "closed" ? (
        <div className="bg-[#f0f2f5] px-4 py-3 text-center text-sm text-neutral-500">
          This conversation is closed. Reopen it to reply.
        </div>
      ) : (
        <Composer
          onSendText={(body) => reply({ body })}
          onSendFile={sendMedia}
          onSendVoice={sendMedia}
          disabled={busy}
          placeholder="Reply as agent…"
        />
      )}
    </div>
  );
}

function HeaderBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
    >
      {children}
    </button>
  );
}
