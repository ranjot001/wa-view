import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { broadcast, rateLimit } from "@/lib/security";
import { LOBBY } from "@/lib/call/constants";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ring") }),
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("decline"), conversationId: z.string().uuid() }),
]);

// Call signalling that must not come straight from the browser:
//  - ring / cancel (customer): the server picks the customer's own conversation and the
//    caller label, so a customer can't ring as someone else.
//  - decline (admin): tells the caller on their private call channel.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;

  if (body.action === "decline") {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await broadcast(`call:${body.conversationId}`, "decline", { from: "agent" });
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rings repeat every 3 s while waiting, so allow ~1 call's worth per minute plus slack.
  if (!(await rateLimit(`call:${user.id}`, 40, 60))) {
    return NextResponse.json({ error: "Too many calls — please wait" }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: conversation } = await admin
    .from("conversations")
    .select("id, status, profile:profiles!conversations_user_id_fkey(phone, display_name)")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; status: string; profile: { phone: string | null; display_name: string | null } | null }>();
  if (!conversation) return NextResponse.json({ error: "No conversation" }, { status: 404 });
  if (conversation.status === "closed" && body.action === "ring") {
    return NextResponse.json({ error: "This chat is closed" }, { status: 409 });
  }

  const label = conversation.profile?.display_name || conversation.profile?.phone || "Customer";
  await broadcast(LOBBY, body.action, { conversationId: conversation.id, label });
  return NextResponse.json({ ok: true });
}
