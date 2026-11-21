"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadChatMedia } from "@/lib/upload";
import type { Conversation, Message } from "@/lib/types";
import { ChatHeader } from "./ChatHeader";
import { InstallBanner } from "./InstallBanner";
import { InstallModal } from "./InstallModal";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { useRealtimeMessages } from "./useRealtimeMessages";
import { useCall } from "@/components/call/useCall";
import { CallScreen } from "@/components/call/CallScreen";
import { LogoTile } from "@/components/ui/Logo";
import {
  ChatsIcon,
  PhoneIcon,
  SearchIcon,
  SettingsIcon,
  StatusIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { formatPhone } from "@/lib/format";
import { LocalTime } from "@/components/ui/LocalTime";
import { usePwaInstall } from "@/lib/pwa";

const MODAL_SEEN_KEY = "book:install-modal-seen";
// Turned off for now: don't pop the install popup automatically when the chat opens.
// Customers can still install from the Install button in the top bar.
// Set to true to bring the automatic popup back.
const AUTO_SHOW_INSTALL_POPUP = false;

export function ChatClient({
  conversation,
  initialMessages,
  bookName,
  supportName,
  customerPhone,
}: {
  conversation: Conversation;
  initialMessages: Message[];
  bookName: string;
  supportName: string;
  customerPhone: string;
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
  const [showInstall, setShowInstall] = useState(false);
  const call = useCall(supabase);
  const pwa = usePwaInstall();

  // Show the install popup once per browser session until the app is installed.
  useEffect(() => {
    if (!AUTO_SHOW_INSTALL_POPUP || !pwa.ready || pwa.installed) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(MODAL_SEEN_KEY) === "1";
      sessionStorage.setItem(MODAL_SEEN_KEY, "1");
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setShowInstall(true), 900);
    return () => clearTimeout(t);
  }, [pwa.ready, pwa.installed]);

  // Clear the typing indicator once a bot/admin reply lands.
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
    else setTyping(false); // no automatic reply — an agent will answer
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

  const startCall = () => call.startCall(conversation.id);
  const last = messages[messages.length - 1];

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white text-neutral-900">
      {/* Left icon rail (desktop) */}
      <nav className="hidden w-[68px] shrink-0 flex-col items-center gap-2 border-r border-white/5 bg-[var(--rail)] py-3 md:flex">
        <LogoTile size={44} rounded="rounded-full" />
        <RailButton active title="Chats">
          <ChatsIcon className="h-6 w-6" />
        </RailButton>
        <Link href="/links" title="Updates" aria-label="Updates" className={railCls(false)}>
          <StatusIcon className="h-6 w-6" />
        </Link>
        <RailButton title="Call support" onClick={startCall}>
          <PhoneIcon className="h-6 w-6" />
        </RailButton>
        <div className="flex-1" />
        <RailButton title="App" onClick={() => setShowInstall(true)}>
          <SettingsIcon className="h-6 w-6" />
        </RailButton>
        <div
          title={formatPhone(customerPhone)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 ring-1 ring-white/10"
        >
          <UserIcon className="h-6 w-6" />
        </div>
      </nav>

      {/* Chat list (desktop) */}
      <ChatList supportName={supportName} bookName={bookName} last={last} phone={formatPhone(customerPhone)} />

      {/* Conversation pane */}
      <section className="flex min-w-0 flex-1 flex-col">
        <ChatHeader bookName={bookName} supportName={supportName} status={status} onCall={startCall} />
        <InstallBanner bookName={bookName} onInstall={() => setShowInstall(true)} />
        <MessageList
          messages={messages}
          mineSide="user"
          typing={typing}
          startedWith={supportName}
          botName={bookName}
          loggedInAs={formatPhone(customerPhone)}
        />
        <Composer
          onSendText={sendText}
          onSendFile={sendMedia}
          onSendVoice={sendMedia}
          disabled={busy || status === "closed"}
          placeholder={status === "closed" ? "This chat is closed" : "Type a message..."}
        />
      </section>

      {showInstall && <InstallModal bookName={bookName} onClose={() => setShowInstall(false)} />}

      {call.session && (
        <CallScreen
          name={bookName}
          subtitle={supportName}
          avatar={<LogoTile size={112} rounded="rounded-full" />}
          state={call.session.state}
          error={call.session.error}
          connectedAt={call.session.connectedAt}
          muted={call.session.muted}
          onMute={() => call.session?.toggleMute()}
          onHangup={() => call.session?.hangup()}
          onClose={call.close}
        />
      )}
    </div>
  );
}

function railCls(active: boolean) {
  return `flex h-11 w-11 items-center justify-center rounded-full transition ${
    active
      ? "bg-white/10 text-[var(--gold-400)] shadow-[inset_0_0_0_1px_rgba(235,197,106,0.35)]"
      : "text-white/55 hover:bg-white/5 hover:text-white"
  }`;
}

function RailButton({
  children,
  active = false,
  title,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} title={title} aria-label={title} className={railCls(active)}>
      {children}
    </button>
  );
}

function ChatList({
  supportName,
  bookName,
  last,
  phone,
}: {
  supportName: string;
  bookName: string;
  last?: Message;
  phone: string;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "unread">("all");

  const preview = last
    ? last.body?.replace(/\s+/g, " ").trim() ||
      (last.media_type === "audio" ? "🎤 Voice message" : last.media_type === "image" ? "📷 Photo" : "📎 Attachment")
    : "Tap to start chatting";
  const prefix = last && last.sender_type === "bot" ? `${bookName}: ` : "";
  const unread = !!last && last.sender_type !== "user";
  const q = query.trim().toLowerCase();
  const visible =
    (tab === "all" || unread) &&
    (!q || supportName.toLowerCase().includes(q) || preview.toLowerCase().includes(q));

  return (
    <aside className="hidden w-[34%] max-w-[440px] shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
      <div className="px-5 pb-3 pt-5">
        <h1 className="text-2xl font-bold">Chats</h1>
        {phone && (
          <p className="mt-0.5 text-sm text-neutral-500">
            Logged in as <span className="font-semibold tabular-nums text-neutral-800">{phone}</span>
          </p>
        )}
      </div>
      <div className="px-4">
        <label className="flex items-center gap-3 rounded-xl bg-[var(--cream-100)] px-4 py-2.5 text-neutral-500">
          <SearchIcon className="h-5 w-5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-500"
          />
        </label>
      </div>
      <div className="flex gap-2 px-4 py-3">
        {(["all", "unread"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-[15px] ${
              tab === t ? "bg-[var(--olive-soft)] font-medium text-neutral-800" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {t === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      {visible ? (
        <div className="flex items-center gap-3 border-l-[3px] border-[var(--gold-500)] bg-[var(--cream-100)] px-4 py-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink-800)] text-[var(--gold-300)]">
              <UserIcon className="h-8 w-8" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-neutral-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[16px] font-medium">💻 {supportName}</p>
              {last && <span className="shrink-0 text-xs text-neutral-500"><LocalTime iso={last.created_at} /></span>}
            </div>
            <p className="truncate text-sm text-neutral-500">
              {prefix}
              {preview}
            </p>
          </div>
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-neutral-400">No chats found</p>
      )}
    </aside>
  );
}
