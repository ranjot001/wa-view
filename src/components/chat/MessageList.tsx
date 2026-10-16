"use client";

import { useEffect, useRef } from "react";
import type { Message, SenderType } from "@/lib/types";
import { dayKey, dayLabel } from "@/lib/format";
import { MessageBubble } from "./MessageBubble";

// `mineSide` decides which sender_type sits on the right:
//  - user chat view -> "user"
//  - admin thread view -> "admin"
export function MessageList({
  messages,
  mineSide,
  typing,
}: {
  messages: Message[];
  mineSide: SenderType;
  typing?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  let lastDay = "";

  return (
    <div className="wa-wallpaper scrollbar-thin flex-1 space-y-1.5 overflow-y-auto py-3">
      {messages.length === 0 && (
        <div className="mx-auto mt-10 w-fit rounded-lg bg-white/80 px-4 py-2 text-center text-sm text-neutral-600 shadow">
          Say hi 👋 — how can we help you today?
        </div>
      )}

      {messages.map((m) => {
        const k = dayKey(m.created_at);
        const showDay = k !== lastDay;
        lastDay = k;
        const mine =
          mineSide === "user" ? m.sender_type === "user" : m.sender_type === "admin";
        return (
          <div key={m.id}>
            {showDay && (
              <div className="my-3 flex justify-center">
                <span className="rounded-md bg-white/85 px-3 py-1 text-xs text-neutral-500 shadow-sm">
                  {dayLabel(m.created_at)}
                </span>
              </div>
            )}
            <MessageBubble m={m} mine={mine} />
          </div>
        );
      })}

      {typing && (
        <div className="flex justify-start px-3">
          <div className="bubble-in relative rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
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

const Dot = ({ d }: { d: number }) => (
  <span
    className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"
    style={{ animationDelay: `${d}ms` }}
  />
);
