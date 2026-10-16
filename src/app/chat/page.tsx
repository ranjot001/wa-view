import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatClient } from "@/components/chat/ChatClient";
import type { Conversation, Message } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/verify");

  // Ensure a conversation exists for this user (RLS: users insert their own).
  let { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Conversation>();

  if (!conversation) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, status: "bot" })
      .select("*")
      .single<Conversation>();
    conversation = created;
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
    />
  );
}
