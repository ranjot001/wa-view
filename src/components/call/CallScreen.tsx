"use client";

import { useEffect, useState } from "react";
import type { CallState } from "@/lib/call/session";
import { HangUpIcon, MicIcon, MicOffIcon, PhoneIcon } from "@/components/ui/Icons";

const STATE_TEXT: Record<CallState, string> = {
  idle: "",
  ringing: "Ringing…",
  connecting: "Connecting…",
  connected: "",
  ended: "Call ended",
  declined: "Agent busy — chat par message karein",
  no_answer: "No answer — thodi der baad try karein",
  failed: "Call failed",
};

function useElapsed(since: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  if (!since) return "00:00";
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// Full-screen WhatsApp-style call overlay used by both the customer and the agent.
export function CallScreen({
  name,
  subtitle,
  avatar,
  state,
  error,
  connectedAt,
  muted,
  onMute,
  onHangup,
  onClose,
  incoming,
  onAccept,
}: {
  name: string;
  subtitle?: string;
  avatar: React.ReactNode;
  state: CallState | "incoming";
  error?: string | null;
  connectedAt?: number | null;
  muted?: boolean;
  onMute?: () => void;
  onHangup: () => void;
  onClose?: () => void;
  incoming?: boolean;
  onAccept?: () => void;
}) {
  const elapsed = useElapsed(state === "connected" ? connectedAt ?? null : null);
  const over = state === "ended" || state === "declined" || state === "no_answer" || state === "failed";

  // Auto-dismiss the overlay a moment after the call is over.
  useEffect(() => {
    if (!over || !onClose) return;
    const id = setTimeout(onClose, state === "ended" ? 1200 : 3500);
    return () => clearTimeout(id);
  }, [over, state, onClose]);

  const status =
    state === "incoming"
      ? "Incoming voice call…"
      : state === "connected"
        ? elapsed
        : state === "failed" && error
          ? error
          : STATE_TEXT[state];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between call-bg px-6 pb-14 pt-20 text-white">
      <div className="flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--gold-300)]/70">
          {incoming ? "Sprinter Care · Incoming" : "Sprinter Care · Voice call"}
        </p>
        <div className="relative mt-10">
          {(state === "ringing" || state === "incoming") && (
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--gold-400)]/20" />
          )}
          <div className="relative overflow-hidden rounded-full ring-4 ring-white/10">{avatar}</div>
        </div>
        <h2 className="mt-6 text-2xl font-semibold">{name}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>}
        <p
          className={`mt-3 text-base ${state === "connected" ? "tabular-nums text-[var(--gold-300)]" : "text-white/75"} ${
            state === "failed" ? "max-w-xs text-red-200" : ""
          }`}
        >
          {status}
        </p>
      </div>

      {state === "incoming" ? (
        <div className="flex w-full max-w-xs items-center justify-between">
          <RoundBtn label="Decline" onClick={onHangup} className="bg-red-500 hover:bg-red-600">
            <HangUpIcon className="h-7 w-7" />
          </RoundBtn>
          <RoundBtn label="Accept" onClick={onAccept!} className="animate-bounce bg-emerald-500 hover:bg-emerald-600">
            <PhoneIcon className="h-7 w-7" />
          </RoundBtn>
        </div>
      ) : over ? (
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/20"
        >
          Back to chat
        </button>
      ) : (
        <div className="flex w-full max-w-xs items-center justify-around">
          <RoundBtn
            label={muted ? "Unmute" : "Mute"}
            onClick={onMute!}
            className={muted ? "bg-white text-[var(--ink-900)]" : "bg-white/15 hover:bg-white/25"}
          >
            {muted ? <MicOffIcon className="h-6 w-6" /> : <MicIcon className="h-6 w-6" />}
          </RoundBtn>
          <RoundBtn label="End" onClick={onHangup} className="bg-red-500 hover:bg-red-600">
            <HangUpIcon className="h-7 w-7" />
          </RoundBtn>
        </div>
      )}
    </div>
  );
}

function RoundBtn({
  children,
  label,
  onClick,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        aria-label={label}
        className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${className}`}
      >
        {children}
      </button>
      <span className="text-xs text-white/70">{label}</span>
    </div>
  );
}
