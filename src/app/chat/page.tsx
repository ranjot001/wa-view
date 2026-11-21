import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings, renderWelcome } from "@/lib/settings";
import { ChatClient } from "@/components/chat/ChatClient";
import type { Conversation, Message } from "@/lib/types";

export const dynamic = "force-dynamic";

// Creates the customer's single conversation (plus the welcome message) exactly once.
// Right after login the page is often requested twice at the same moment, so two
// requests can race here: only one insert wins (unique user_id); the loser reads the
// winner's row back. Uses the service role — customers can't write tables directly.
async function ensureConversation(userId: string, welcome: string): Promise<Conversation | null> {
  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("conversations")
    .insert({ user_id: userId, status: "bot" })
    .select("*")
    .maybeSingle<Conversation>();

  if (created) {
    const { error: msgErr } = await admin
      .from("messages")
      .insert({ conversation_id: created.id, sender_type: "bot", body: welcome });
    if (msgErr) console.error("[chat] welcome message failed:", msgErr.message);
    return created;
  }
  if (error && error.code !== "23505") console.error("[chat] create conversation failed:", error.code, error.message);

  // Lost the race (or a transient error): the other request's row should be there.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data } = await admin.from("conversations").select("*").eq("user_id", userId).maybeSingle<Conversation>();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/verify");

  // Ensure a conversation exists for this user. Customers can't write tables directly
  // (migration 0003), so create it with the service role, scoped to this user's id.
  let { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Conversation>();

  const settings = await getSettings();

  if (!conversation) {
    conversation = await ensureConversation(user.id, renderWelcome(settings));
  }

  if (!conversation) {
    throw new Error("Could not create conversation");
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  return (
    <ChatClient
      conversation={conversation}
      initialMessages={messages ?? []}
      bookName={settings.bookName}
      supportName={settings.supportName}
      customerPhone={user.phone ? `+${user.phone.replace(/^\+/, "")}` : ""}
    />
  );
}
