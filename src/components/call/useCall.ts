"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CallSession } from "@/lib/call/session";
import { startTone } from "./tones";

// React wrapper around a CallSession: re-renders on every state change and plays
// the ringback tone while the caller is waiting.
export function useCall(supabase: SupabaseClient) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const ref = useRef<CallSession | null>(null);
  const stopTone = useRef<(() => void) | null>(null);

  const session = ref.current;

  useEffect(() => {
    const ringing = session?.state === "ringing";
    if (ringing && !stopTone.current) stopTone.current = startTone("ringback");
    if (!ringing && stopTone.current) {
      stopTone.current();
      stopTone.current = null;
    }
  });

  // Hang up if the component unmounts mid-call (e.g. navigation).
  useEffect(
    () => () => {
      ref.current?.hangup();
      stopTone.current?.();
    },
    []
  );

  const startCall = useCallback(
    (conversationId: string) => {
      if (ref.current && ["ringing", "connecting", "connected"].includes(ref.current.state)) return;
      ref.current = new CallSession(supabase, conversationId, "caller", rerender);
      ref.current.start();
      rerender();
    },
    [supabase]
  );

  const acceptCall = useCallback(
    (conversationId: string) => {
      ref.current = new CallSession(supabase, conversationId, "callee", rerender);
      ref.current.accept();
      rerender();
    },
    [supabase]
  );

  const close = useCallback(() => {
    ref.current = null;
    rerender();
  }, []);

  return { session, startCall, acceptCall, close };
}
