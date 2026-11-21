import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings, renderWelcome } from "@/lib/settings";
import { ChatClient } from "@/components/chat/ChatClient";
import type { Conversation, Message } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    const admin = createAdminClient();
    const { data: created } = await admin
      .from("conversations")
      .upsert({ user_id: user.id, status: "bot" }, { onConflict: "user_id", ignoreDuplicates: true })
      .select("*")
      .maybeSingle<Conversation>();
    // Brand-new chat: post the admin's welcome message as the first (automatic) reply.
    if (created) {
      await admin
        .from("messages")
        .insert({ conversation_id: created.id, sender_type: "bot", body: renderWelcome(settings) });
    }
    conversation =
      created ??
      (
        await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle<Conversation>()
      ).data;
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
