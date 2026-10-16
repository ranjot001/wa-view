"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, ConversationStatus, ConversationWithProfile } from "@/lib/types";
import { maskPhone, formatTime } from "@/lib/format";
import { SignOutButton } from "./SignOutButton";

const STATUS_META: Record<ConversationStatus, { label: string; cls: string }> = {
  pending_human: { label: "Needs agent", cls: "bg-amber-100 text-amber-800" },
  human: { label: "With agent", cls: "bg-emerald-100 text-emerald-800" },
  bot: { label: "Bot", cls: "bg-neutral-200 text-neutral-700" },
  closed: { label: "Closed", cls: "bg-neutral-100 text-neutral-400" },
};

const FILTERS: (ConversationStatus | "all")[] = ["all", "pending_human", "human", "bot", "closed"];

export function AdminConversationList({
  initial,
  adminName,
}: {
  initial: ConversationWithProfile[];
  adminName: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState(initial);
  const [filter, setFilter] = useState<ConversationStatus | "all">("all");

  useEffect(() => {
    const channel = supabase
      .channel("admin:conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload) => {
          const row = payload.new as Conversation;
          setList((prev) => {
            const existing = prev.find((c) => c.id === row.id);
            const merged: ConversationWithProfile = existing
              ? { ...existing, ...row }
              : { ...row, profile: null };
            const rest = prev.filter((c) => c.id !== row.id);
            return [merged, ...rest].sort((a, b) =>
              (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "")
            );
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const shown = filter === "all" ? list : list.filter((c) => c.status === filter);

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[var(--wa-header)] px-4 py-3 text-white">
        <div>
          <h1 className="font-semibold">Support Inbox</h1>
          <p className="text-xs text-emerald-100/80">Signed in as {adminName}</p>
        </div>
        <SignOutButton />
      </header>

      <div className="flex gap-2 overflow-x-auto border-b px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              filter === f ? "bg-[var(--wa-header)] text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {f === "all" ? "All" : STATUS_META[f].label}
          </button>
        ))}
      </div>

      <ul className="divide-y">
        {shown.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-neutral-400">No conversations.</li>
        )}
        {shown.map((c) => {
          const meta = STATUS_META[c.status];
          return (
            <li key={c.id}>
              <Link
                href={`/admin/conversations/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--wa-header)]/10 font-semibold text-[var(--wa-header)]">
                  {(c.profile?.phone ?? "?").slice(-2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-800">
                    {c.profile?.display_name || maskPhone(c.profile?.phone)}
                  </p>
                  <p className="truncate text-sm text-neutral-500">
                    {c.last_message_at ? `Last activity ${formatTime(c.last_message_at)}` : "No messages yet"}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
                  {meta.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
