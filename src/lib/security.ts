import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

// Fixed-window rate limit backed by Postgres (see migration 0003). Returns true when the
// request is allowed. If the limiter itself errors, we allow the request and log, so a
// DB hiccup doesn't take the whole app down.
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rateLimit] limiter unavailable:", error.message);
    return true;
  }
  return data === true;
}

// Client IP. On Vercel, x-real-ip / x-forwarded-for are set by the platform.
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Media URLs must point at our own storage bucket, inside this conversation's folder.
// Blocks javascript:/data: links and links to other sites or other customers' files.
export function isOwnMediaUrl(url: string, conversationId: string): boolean {
  try {
    const u = new URL(url);
    const base = new URL(env.supabaseUrl());
    return (
      u.protocol === "https:" &&
      u.origin === base.origin &&
      u.pathname.startsWith(`/storage/v1/object/public/chat-media/${conversationId}/`) &&
      !u.pathname.includes("..") &&
      !u.search &&
      !u.hash
    );
  } catch {
    return false;
  }
}

// Server-side broadcast to a PRIVATE realtime channel (uses the service-role key).
export async function broadcast(topic: string, event: string, payload: Record<string, unknown>) {
  const key = env.supabaseServiceRoleKey();
  const res = await fetch(`${env.supabaseUrl()}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ topic, event, payload, private: true }] }),
  });
  if (!res.ok) throw new Error(`broadcast failed: ${res.status}`);
}
