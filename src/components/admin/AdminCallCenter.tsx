"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOBBY, privateChannel, type RingPayload } from "@/lib/call/session";
import { CallScreen } from "@/components/call/CallScreen";
import { useCall } from "@/components/call/useCall";
import { startTone } from "@/components/call/tones";

// Mounted across the admin inbox: listens for customers ringing, shows the
// incoming-call screen, and runs the agent side of the call.
export function AdminCallCenter() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { session, acceptCall, close } = useCall(supabase);
  const [incoming, setIncoming] = useState<RingPayload | null>(null);
  const [active, setActive] = useState<RingPayload | null>(null);
  // Rings keep repeating until the caller hears our decline; ignore them briefly.
  const ignoreUntil = useRef<Record<string, number>>({});
  const busy = useRef(false);
  busy.current = !!session && ["connecting", "connected"].includes(session.state);

  useEffect(() => {
    const lobby = privateChannel(supabase, LOBBY);
    lobby
      .on("broadcast", { event: "ring" }, ({ payload }) => {
        const p = payload as RingPayload;
        if (busy.current || (ignoreUntil.current[p.conversationId] ?? 0) > Date.now()) return;
        setIncoming((cur) => cur ?? p);
      })
      .on("broadcast", { event: "cancel" }, ({ payload }) => {
        setIncoming((cur) => (cur?.conversationId === payload?.conversationId ? null : cur));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(lobby);
    };
  }, [supabase]);

  // Ringtone while a call is waiting to be answered.
  useEffect(() => {
    if (!incoming) return;
    return startTone("ringtone");
  }, [incoming]);

  function accept() {
    if (!incoming) return;
    // Another agent may already have picked this up; the first to accept wins on the caller side.
    setActive(incoming);
    setIncoming(null);
    acceptCall(incoming.conversationId);
    router.push(`/admin/conversations/${incoming.conversationId}`);
  }

  function decline() {
    if (!incoming) return;
    ignoreUntil.current[incoming.conversationId] = Date.now() + 8000;
    fetch("/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline", conversationId: incoming.conversationId }),
    }).catch(() => {});
    setIncoming(null);
  }

  const avatar = (label: string) => (
    <div className="flex h-28 w-28 items-center justify-center bg-white/10 text-3xl font-semibold">
      {label.replace(/\D/g, "").slice(-2) || "?"}
    </div>
  );

  if (incoming) {
    return (
      <CallScreen
        incoming
        name={incoming.label}
        subtitle="Customer"
        avatar={avatar(incoming.label)}
        state="incoming"
        onAccept={accept}
        onHangup={decline}
      />
    );
  }

  if (session && active) {
    return (
      <CallScreen
        name={active.label}
        subtitle="Customer"
        avatar={avatar(active.label)}
        state={session.state}
        error={session.error}
        connectedAt={session.connectedAt}
        muted={session.muted}
        onMute={() => session.toggleMute()}
        onHangup={() => session.hangup()}
        onClose={() => {
          setActive(null);
          close();
        }}
      />
    );
  }

  return null;
}
