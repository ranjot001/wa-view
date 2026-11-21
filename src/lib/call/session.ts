"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Peer-to-peer voice calls (WebRTC) between a customer and a support agent.
// Signalling rides on Supabase Realtime broadcast:
//   - LOBBY channel "calls:lobby" (admins only): rings / cancels, sent by the server via
//     POST /api/call so a customer can't spoof them or listen to other customers' rings.
//   - Per-call channel "call:<conversationId>" (that customer + admins):
//     accept → offer → answer → ice → hangup, plus "decline" sent by the server.
// All channels are private; access is enforced by realtime RLS (migration 0003).

export { LOBBY } from "./constants";

export function privateChannel(supabase: SupabaseClient, topic: string) {
  return supabase.channel(topic, { config: { private: true, broadcast: { self: false } } });
}

function callApi(body: Record<string, unknown>) {
  return fetch("/api/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type CallState =
  | "idle"
  | "ringing" // caller: waiting for agent to pick up
  | "connecting"
  | "connected"
  | "ended"
  | "declined"
  | "no_answer"
  | "failed";

export interface RingPayload {
  conversationId: string;
  label: string; // shown on the agent's incoming-call screen
}

const RING_TIMEOUT_MS = 45_000;
const RING_REPEAT_MS = 3_000; // re-broadcast so agents who open the inbox mid-ring still see it

function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];
  if (env.turnUrl()) {
    servers.push({
      urls: env.turnUrl(),
      username: env.turnUsername(),
      credential: env.turnCredential(),
    });
  }
  return servers;
}

// Session descriptions are host objects; send plain JSON over the wire.
function plain(d: RTCSessionDescription | null): RTCSessionDescriptionInit | null {
  return d ? { type: d.type, sdp: d.sdp } : null;
}

function subscribe(channel: RealtimeChannel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") reject(new Error(status));
    });
  });
}

export class CallSession {
  state: CallState = "idle";
  error: string | null = null;
  muted = false;
  connectedAt: number | null = null;

  private pc: RTCPeerConnection | null = null;
  private local: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private call: RealtimeChannel | null = null;
  private pendingIce: RTCIceCandidateInit[] = [];
  private ringTimer: ReturnType<typeof setInterval> | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  // Several agents may hear the same ring; every message carries `from` so the caller
  // can pin the first agent who accepted and ignore the rest.
  private me: string;
  private peer: string | null = null;

  constructor(
    private supabase: SupabaseClient,
    private conversationId: string,
    private role: "caller" | "callee",
    private onChange: () => void
  ) {
    this.me = role === "caller" ? "caller" : crypto.randomUUID();
    if (role === "callee") this.peer = "caller";
  }

  // ---------- caller (customer) ----------

  async start() {
    this.set("ringing");
    try {
      await this.getMic();
      this.openCallChannel();
      this.call!.on("broadcast", { event: "decline" }, () => {
        if (this.state === "ringing") this.finish("declined", false);
      });
      this.call!.on("broadcast", { event: "accept" }, ({ payload }) => this.onAccepted(payload.from));
      this.call!.on("broadcast", { event: "answer" }, ({ payload }) => {
        if (payload.from !== this.peer) return;
        this.pc?.setRemoteDescription(payload.sdp).then(() => this.flushIce());
      });
      await subscribe(this.call!);
    } catch (e) {
      return this.fail(e);
    }
    if (this.state !== "ringing") return; // hung up while we were connecting

    const ring = () => {
      callApi({ action: "ring" })
        .then((res) => {
          if (res.status === 429 || res.status === 409) {
            this.error = res.status === 429 ? "Too many calls — please wait" : "This chat is closed";
            this.finish("failed", false);
          }
        })
        .catch(() => {});
    };
    ring();
    this.ringTimer = setInterval(ring, RING_REPEAT_MS);
    this.timeout = setTimeout(() => {
      if (this.state === "ringing") this.finish("no_answer", true);
    }, RING_TIMEOUT_MS);
  }

  private async onAccepted(agent: string) {
    if (this.state !== "ringing") return;
    this.peer = agent;
    this.stopRinging();
    this.set("connecting");
    try {
      const pc = this.createPeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.send("offer", { sdp: plain(pc.localDescription), to: agent });
    } catch (e) {
      this.fail(e);
    }
  }

  // ---------- callee (agent) ----------

  async accept() {
    this.set("connecting");
    try {
      await this.getMic();
      this.openCallChannel();
      this.call!.on("broadcast", { event: "offer" }, ({ payload }) => {
        if (payload.to === this.me) return this.onOffer(payload.sdp);
        this.error = "Call was picked up by another agent";
        this.finish("failed", false);
      });
      await subscribe(this.call!);
      this.createPeer();
      this.send("accept", {});
      // No offer means the customer already hung up.
      this.timeout = setTimeout(() => {
        if (this.state === "connecting" && !this.pc?.remoteDescription) {
          this.error = "Customer ne call cut kar di";
          this.finish("failed", false);
        }
      }, 10_000);
    } catch (e) {
      this.fail(e);
    }
  }

  private async onOffer(sdp: RTCSessionDescriptionInit) {
    const pc = this.pc;
    if (!pc) return;
    try {
      await pc.setRemoteDescription(sdp);
      await this.flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.send("answer", { sdp: plain(pc.localDescription) });
    } catch (e) {
      this.fail(e);
    }
  }

  // ---------- shared ----------

  hangup() {
    const wasRinging = this.state === "ringing";
    this.finish("ended", wasRinging);
  }

  toggleMute() {
    this.muted = !this.muted;
    this.local?.getAudioTracks().forEach((t) => (t.enabled = !this.muted));
    this.onChange();
  }

  private openCallChannel() {
    this.call = privateChannel(this.supabase, `call:${this.conversationId}`);
    this.call.on("broadcast", { event: "ice" }, ({ payload }) => {
      if (payload.from === this.peer) this.onRemoteIce(payload.candidate);
    });
    this.call.on("broadcast", { event: "hangup" }, ({ payload }) => {
      if (payload.from === this.peer) this.finish("ended", false);
    });
  }

  private createPeer() {
    const pc = new RTCPeerConnection({ iceServers: iceServers() });
    this.pc = pc;
    this.local?.getTracks().forEach((t) => pc.addTrack(t, this.local!));

    pc.onicecandidate = (e) => {
      if (e.candidate) this.send("ice", { candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.autoplay = true;
      }
      this.audio.srcObject = e.streams[0];
      this.audio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected" && this.state !== "connected") {
        this.connectedAt = Date.now();
        this.set("connected");
      } else if (pc.connectionState === "failed") {
        this.fail(new Error("Connection failed — network blocked the call"));
      } else if (pc.connectionState === "disconnected" && this.state === "connected") {
        // Give it a moment to recover before giving up.
        setTimeout(() => {
          if (pc.connectionState === "disconnected") this.finish("ended", true);
        }, 5000);
      }
    };
    return pc;
  }

  private async onRemoteIce(candidate: RTCIceCandidateInit) {
    if (!this.pc || !this.pc.remoteDescription) {
      this.pendingIce.push(candidate);
      return;
    }
    await this.pc.addIceCandidate(candidate).catch(() => {});
  }

  private async flushIce() {
    const queued = this.pendingIce.splice(0);
    for (const c of queued) await this.pc?.addIceCandidate(c).catch(() => {});
  }

  private async getMic() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Calling needs HTTPS and a browser with microphone support");
    }
    try {
      this.local = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      throw new Error("Microphone permission chahiye — browser settings mein allow karein");
    }
  }

  private send(event: string, payload: Record<string, unknown>) {
    this.call?.send({ type: "broadcast", event, payload: { ...payload, from: this.me } });
  }

  private stopRinging() {
    if (this.ringTimer) clearInterval(this.ringTimer);
    if (this.timeout) clearTimeout(this.timeout);
    this.ringTimer = this.timeout = null;
  }

  private fail(e: unknown) {
    this.error = e instanceof Error ? e.message : "Call failed";
    this.finish("failed", this.role === "caller" && this.state === "ringing");
  }

  // Ends the call locally and tells the other side.
  private finish(state: CallState, cancelRing: boolean) {
    if (["ended", "declined", "no_answer", "failed"].includes(this.state)) return;
    this.stopRinging();
    if (cancelRing) callApi({ action: "cancel" }).catch(() => {});
    if (state !== "declined") this.send("hangup", {});

    this.local?.getTracks().forEach((t) => t.stop());
    this.pc?.close();
    if (this.audio) this.audio.srcObject = null;
    // Pushes are ordered on the socket, so the broadcasts above go out before the leave.
    if (this.call) this.supabase.removeChannel(this.call);
    this.pc = null;
    this.local = null;
    this.call = null;
    this.set(state);
  }

  private set(s: CallState) {
    this.state = s;
    this.onChange();
  }
}
