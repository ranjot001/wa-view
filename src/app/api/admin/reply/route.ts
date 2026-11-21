import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminReplySchema } from "@/lib/validation";
import { isOwnMediaUrl } from "@/lib/security";
import type { Message } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = adminReplySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { conversationId, body, mediaUrl, mediaType } = parsed.data;
  if (!body && !mediaUrl) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  if (mediaUrl && (!mediaType || !isOwnMediaUrl(mediaUrl, conversationId))) {
    return NextResponse.json({ error: "Invalid attachment" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: exists } = await admin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!exists) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  // Replying takes ownership: move to human mode and assign this admin.
  await admin
    .from("conversations")
    .update({ status: "human", assigned_admin: ctx.user.id })
    .eq("id", conversationId)
    .in("status", ["bot", "pending_human", "human"]);

  const { data: message, error } = await admin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "admin",
      sender_id: ctx.user.id,
      body: body ?? null,
      media_url: mediaUrl ?? null,
      media_type: mediaType ?? null,
    })
    .select("*")
    .single<Message>();

  if (error || !message) {
    return NextResponse.json({ error: "Could not send" }, { status: 500 });
  }
  return NextResponse.json({ message });
}
