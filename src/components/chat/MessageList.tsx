"use client";

import { useEffect, useRef } from "react";
import type { Message, SenderType } from "@/lib/types";
import { dayKey } from "@/lib/format";
import { LocalTime, useMounted } from "@/components/ui/LocalTime";
import { MessageBubble } from "./MessageBubble";

// `mineSide` decides which sender_type sits on the right:
//  - user chat view -> "user"
//  - admin thread view -> "admin"
export function MessageList({
  messages,
  mineSide,
  typing,
  startedWith,
  botName,
  loggedInAs,
}: {
  messages: Message[];
  mineSide: SenderType;
  typing?: boolean;
  // Customer view: "Chat started with <support name>" chip + agent-joined notice.
  startedWith?: string;
  // Name shown on bot bubbles (the book name).
  botName?: string;
  // Customer view: "Logged in as +91 98765 43210" chip at the top.
  loggedInAs?: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  // Day separators depend on the viewer's timezone — only compute them in the browser.
  const mounted = useMounted();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  let lastDay = "";
  let agentSeen = false;

  return (
    <div className="chat-doodle scrollbar-thin flex-1 space-y-2 overflow-y-auto py-4">
      {messages.length === 0 && !startedWith && (
        <Chip>Say hi 👋 — how can we help you today?</Chip>
      )}
      {messages.length === 0 && startedWith && <Chip tone="sys">Chat started with 💻 {startedWith}</Chip>}
      {messages.length === 0 && loggedInAs && <LoggedInChip phone={loggedInAs} />}

      {messages.map((m, i) => {
        const k = mounted ? dayKey(m.created_at) : "";
        const showDay = mounted && k !== lastDay;
        lastDay = k;
        const mine = mineSide === "user" ? m.sender_type === "user" : m.sender_type === "admin";
        const agentJoined = !!startedWith && m.sender_type === "admin" && !agentSeen;
        if (m.sender_type === "admin") agentSeen = true;
        const label =
          m.sender_type === "bot" ? botName : m.sender_type === "admin" && mineSide === "user" ? "Support" : undefined;
        return (
          <div key={m.id} className="space-y-2">
            {showDay && <Chip upper><LocalTime iso={m.created_at} as="day" /></Chip>}
            {i === 0 && startedWith && <Chip tone="sys">Chat started with 💻 {startedWith}</Chip>}
            {i === 0 && loggedInAs && <LoggedInChip phone={loggedInAs} />}
            {agentJoined && <Chip tone="sys">Support agent joined the conversation</Chip>}
            <MessageBubble m={m} mine={mine} label={label} />
          </div>
        );
      })}

      {typing && (
        <div className="flex justify-start px-3 md:px-[6%]">
          <div className="bubble-in relative rounded-xl rounded-tl-none bg-white px-3 py-2.5 shadow-sm">
            <span className="flex gap-1">
              <Dot d={0} /> <Dot d={150} /> <Dot d={300} />
            </span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function LoggedInChip({ phone }: { phone: string }) {
  return (
    <div className="my-1 flex justify-center px-4">
      <span
        data-testid="logged-in-as"
        className="rounded-lg bg-[var(--ink-800)] px-3 py-1.5 text-center text-xs text-white/80 shadow-sm md:text-sm"
      >
        Logged in as <b className="tabular-nums text-[var(--gold-300)]">{phone}</b>
      </span>
    </div>
  );
}

function Chip({
  children,
  tone = "plain",
  upper,
}: {
  children: React.ReactNode;
  tone?: "plain" | "sys";
  upper?: boolean;
}) {
  return (
    <div className="my-1 flex justify-center px-4">
      <span
        className={`rounded-lg px-3 py-1.5 text-center text-xs shadow-sm md:text-sm ${
          tone === "sys" ? "bg-[var(--sys-chip)] text-neutral-700" : "bg-white text-neutral-500"
        } ${upper ? "uppercase tracking-wide" : ""}`}
      >
        {children}
      </span>
    </div>
  );
}

const Dot = ({ d }: { d: number }) => (
  <span
    className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"
    style={{ animationDelay: `${d}ms` }}
  />
);
