import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { messageSchema } from "@/lib/validation";
import { generateBotReply, keywordHandoff } from "@/lib/ai/client";
import type { Conversation, Message } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(json);
  if (!parsed.success || !parsed.data.conversationId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { conversationId, body, mediaUrl, mediaType, replyTo } = parsed.data;
  if (!body && !mediaUrl) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // The conversation must belong to this user (also enforced by RLS).
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle<Conversation>();
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (conversation.status === "closed") {
    return NextResponse.json({ error: "This chat is closed" }, { status: 409 });
  }

  // Insert the user's message (RLS allows own 'user' messages).
  const { data: userMessage, error: insErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "user",
      sender_id: user.id,
      body: body ?? null,
      media_url: mediaUrl ?? null,
      media_type: mediaType ?? null,
      reply_to: replyTo ?? null,
    })
    .select("*")
    .single<Message>();
  if (insErr || !userMessage) {
    return NextResponse.json({ error: "Could not send message" }, { status: 500 });
  }

  // Only the bot auto-replies, and only while the conversation is in bot mode.
  if (conversation.status !== "bot") {
    return NextResponse.json({ userMessage });
  }

  const admin = createAdminClient();

  try {
    const { data: history } = await admin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(24)
      .returns<Message[]>();

    const forcedHandoff = keywordHandoff(body ?? "");
    const result = await generateBotReply(history ?? [userMessage]);
    const handoff = result.handoff || forcedHandoff;

    const { data: botMessage } = await admin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "bot",
        sender_id: null,
        body: result.text,
      })
      .select("*")
      .single<Message>();

    if (handoff) {
      await admin
        .from("conversations")
        .update({ status: "pending_human" })
        .eq("id", conversationId);
    }

    return NextResponse.json({ userMessage, botMessage });
  } catch (e) {
    console.error("[api/chat] bot reply failed:", e);
    // Fall back to a handoff so the user is never left hanging.
    const { data: botMessage } = await admin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "bot",
        body: "Thanks for your message! Let me connect you with a support agent.",
      })
      .select("*")
      .single<Message>();
    await admin
      .from("conversations")
      .update({ status: "pending_human" })
      .eq("id", conversationId);
    return NextResponse.json({ userMessage, botMessage });
  }
}
