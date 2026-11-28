"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, ConversationStatus, ConversationWithProfile } from "@/lib/types";
import { formatPhone } from "@/lib/format";
import { LocalTime } from "@/components/ui/LocalTime";
import { SignOutButton } from "./SignOutButton";
import type { ActivityRow } from "@/app/api/admin/activity/route";
import {
  downloadCsv,
  presetRange,
  rangeLabel,
  rangeSlug,
  toInputDate,
  type RangePreset,
} from "@/lib/dateRange";

const STATUS_META: Record<ConversationStatus, { label: string; cls: string }> = {
  pending_human: { label: "Needs agent", cls: "bg-amber-100 text-amber-800" },
  human: { label: "With agent", cls: "bg-emerald-100 text-emerald-800" },
  bot: { label: "Bot", cls: "bg-neutral-200 text-neutral-700" },
  closed: { label: "Closed", cls: "bg-neutral-100 text-neutral-400" },
};

type Filter = ConversationStatus | "all" | "mine";
const FILTERS: Filter[] = ["all", "mine", "pending_human", "human", "bot", "closed"];

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "any", label: "Any time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "custom", label: "Pick dates" },
];

// "2026-11-28 14:05" in the viewer's timezone — Excel/Sheets read this as a date-time.
function csvTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${toInputDate(d)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function AdminConversationList({
  initial,
  adminName,
  adminId,
}: {
  initial: ConversationWithProfile[];
  adminName: string;
  adminId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // Date filter: which customers messaged in a given window.
  const [preset, setPreset] = useState<RangePreset>("any");
  const [customFrom, setCustomFrom] = useState(() => toInputDate(new Date()));
  const [customTo, setCustomTo] = useState(() => toInputDate(new Date()));
  const [activity, setActivity] = useState<Map<string, ActivityRow> | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const range = useMemo(
    () => presetRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );
  const reqId = useRef(0);

  useEffect(() => {
    const channel = supabase
      .channel("admin:conversations", { config: { private: true } })
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

  // Load activity for the selected range. While the range includes "now", refresh it
  // (debounced) whenever the inbox updates in realtime so today's counts stay current.
  const rangeKey = range ? `${range.from.toISOString()}|${range.to.toISOString()}` : "";
  const isLive = !!range && range.to.getTime() > Date.now();
  const liveTick = isLive ? list : null;
  useEffect(() => {
    if (!range) {
      setActivity(null);
      setActivityError(null);
      return;
    }
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setActivityLoading(true);
      try {
        const qs = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
        const res = await fetch(`/api/admin/activity?${qs}`, { cache: "no-store" });
        const json = await res.json();
        if (id !== reqId.current) return;
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setActivity(new Map((json.rows as ActivityRow[]).map((r) => [r.conversationId, r])));
        setActivityError(json.truncated ? "Very large range — showing the first 50,000 messages." : null);
      } catch (e) {
        if (id === reqId.current) setActivityError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (id === reqId.current) setActivityLoading(false);
      }
    }, activity ? 800 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, liveTick]);

  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const shown = list.filter((c) => {
    if (filter === "mine" ? c.assigned_admin !== adminId : filter !== "all" && c.status !== filter) {
      return false;
    }
    if (range && !activity?.has(c.id)) return false;
    if (!q) return true;
    const phone = (c.profile?.phone ?? "").replace(/\D/g, "");
    const name = (c.profile?.display_name ?? "").toLowerCase();
    return (qDigits !== "" && phone.includes(qDigits)) || name.includes(q);
  });
  const waiting = list.filter((c) => c.status === "pending_human").length;
  const rangeMsgs = range ? shown.reduce((n, c) => n + (activity?.get(c.id)?.messages ?? 0), 0) : 0;

  // Export exactly what's on screen (date range + status filter + search).
  function exportCsv() {
    const name = (c: ConversationWithProfile) => c.profile?.display_name ?? "";
    const phone = (c: ConversationWithProfile) => formatPhone(c.profile?.phone);
    if (range && activity) {
      downloadCsv(
        `contacts_${rangeSlug(range)}.csv`,
        ["Name", "Phone", "Messages", "First message", "Last message", "Status"],
        shown.map((c) => {
          const a = activity.get(c.id)!;
          return [name(c), phone(c), a.messages, csvTime(a.firstAt), csvTime(a.lastAt), STATUS_META[c.status].label];
        })
      );
    } else {
      downloadCsv(
        `contacts_all_${toInputDate(new Date())}.csv`,
        ["Name", "Phone", "Last activity", "Status"],
        shown.map((c) => [name(c), phone(c), csvTime(c.last_message_at), STATUS_META[c.status].label])
      );
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white text-neutral-900">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[var(--wa-header)] px-4 py-3 text-white">
        <div>
          <h1 className="font-semibold">Support Inbox</h1>
          <p className="text-xs text-[var(--gold-300)]/80">
            Signed in as {adminName}
            {waiting > 0 && ` · ${waiting} waiting for an agent`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
          >
            Settings
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="border-b px-3 pt-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by number or name"
          className="w-full rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto border-b px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              filter === f ? "bg-[var(--wa-header)] text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {f === "all" ? "All" : f === "mine" ? "Mine" : STATUS_META[f].label}
          </button>
        ))}
      </div>

      {/* Date filter + export */}
      <div className="border-b px-3 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${
                preset === p.key
                  ? "border-[var(--wa-header)] bg-[var(--olive-soft)] font-semibold text-[var(--wa-header)]"
                  : "border-neutral-200 text-neutral-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <label className="flex items-center gap-1.5">
              From
              <input
                type="date"
                value={customFrom}
                max={toInputDate(new Date())}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-neutral-800"
              />
            </label>
            <label className="flex items-center gap-1.5">
              To
              <input
                type="date"
                value={customTo}
                max={toInputDate(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-neutral-800"
              />
            </label>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm text-neutral-600">
            {range ? (
              activityLoading && !activity ? (
                "Loading…"
              ) : (
                <>
                  <b className="text-neutral-900">{shown.length}</b> {shown.length === 1 ? "customer" : "customers"} ·{" "}
                  <b className="text-neutral-900">{rangeMsgs}</b> {rangeMsgs === 1 ? "message" : "messages"}
                  <span className="block truncate text-xs text-neutral-400">{rangeLabel(range)}</span>
                </>
              )
            ) : (
              <>
                <b className="text-neutral-900">{shown.length}</b> {shown.length === 1 ? "contact" : "contacts"}
              </>
            )}
          </p>
          <button
            onClick={exportCsv}
            disabled={shown.length === 0 || (!!range && !activity)}
            className="shrink-0 rounded-lg bg-[var(--wa-header)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
        {activityError && <p className="mt-1 text-xs text-red-600">{activityError}</p>}
      </div>

      <ul className="divide-y">
        {shown.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-neutral-400">
            {range ? "No customer messages in this period." : "No conversations."}
          </li>
        )}
        {shown.map((c) => {
          const meta = STATUS_META[c.status];
          return (
            <li key={c.id}>
              <Link
                href={`/admin/conversations/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--olive-soft)] font-semibold text-[var(--gold-700)]">
                  {(c.profile?.phone ?? "?").slice(-2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-800">
                    {c.profile?.display_name || formatPhone(c.profile?.phone) || "Unknown"}
                  </p>
                  <p className="truncate text-sm text-neutral-500">
                    {range && activity?.get(c.id) ? (
                      <>
                        {activity.get(c.id)!.messages} msg{activity.get(c.id)!.messages === 1 ? "" : "s"} · last{" "}
                        {range.to.getTime() - range.from.getTime() > 86_400_000 && (
                          <><LocalTime iso={activity.get(c.id)!.lastAt} as="day" />{" "}</>
                        )}
                        <LocalTime iso={activity.get(c.id)!.lastAt} />
                      </>
                    ) : c.last_message_at ? (
                      <>Last activity <LocalTime iso={c.last_message_at} /></>
                    ) : (
                      "No messages yet"
                    )}
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
