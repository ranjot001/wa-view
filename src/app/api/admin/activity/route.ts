import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ConversationStatus } from "@/lib/types";

export const runtime = "nodejs";

// Customers who messaged in a time window: GET /api/admin/activity?from=ISO&to=ISO
// The browser sends the window already converted from the admin's local dates, so
// "Today" means today in the admin's timezone, not the server's (UTC).

export interface ActivityRow {
  conversationId: string;
  phone: string | null;
  name: string | null;
  status: ConversationStatus;
  messages: number; // customer messages inside the window
  firstAt: string;
  lastAt: string;
}

const MAX_DAYS = 400;
const MAX_ROWS = 50_000;
const PAGE = 1000;

const querySchema = z
  .object({ from: z.string().datetime(), to: z.string().datetime() })
  .refine((q) => Date.parse(q.to) > Date.parse(q.from), "`to` must be after `from`")
  .refine((q) => Date.parse(q.to) - Date.parse(q.from) <= MAX_DAYS * 86_400_000, "Range too long");

export async function GET(req: Request) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid range" }, { status: 400 });
  }
  const { from, to } = parsed.data;
  const admin = createAdminClient();

  // 1) Customer messages in the window, aggregated per conversation.
  const agg = new Map<string, { messages: number; firstAt: string; lastAt: string }>();
  let truncated = false;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await admin
      .from("messages")
      .select("conversation_id, created_at")
      .eq("sender_type", "user")
      .gte("created_at", from)
      .lt("created_at", to)
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) return NextResponse.json({ error: "Query failed" }, { status: 500 });
    for (const m of data) {
      const a = agg.get(m.conversation_id);
      if (a) {
        a.messages++;
        a.lastAt = m.created_at;
      } else {
        agg.set(m.conversation_id, { messages: 1, firstAt: m.created_at, lastAt: m.created_at });
      }
    }
    if (data.length < PAGE) break;
    if (offset + PAGE >= MAX_ROWS) {
      truncated = true;
      break;
    }
  }

  // 2) Contact details for those conversations (chunked to keep the URL short).
  const ids = [...agg.keys()];
  const rows: ActivityRow[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await admin
      .from("conversations")
      .select("id, status, profile:profiles!conversations_user_id_fkey(phone, display_name)")
      .in("id", ids.slice(i, i + 200))
      .returns<{ id: string; status: ConversationStatus; profile: { phone: string | null; display_name: string | null } | null }[]>();
    if (error) return NextResponse.json({ error: "Query failed" }, { status: 500 });
    for (const c of data) {
      const a = agg.get(c.id)!;
      rows.push({
        conversationId: c.id,
        phone: c.profile?.phone ?? null,
        name: c.profile?.display_name ?? null,
        status: c.status,
        ...a,
      });
    }
  }
  rows.sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return NextResponse.json({ rows, truncated });
}
