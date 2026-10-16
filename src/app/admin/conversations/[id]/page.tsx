import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminThread } from "@/components/admin/AdminThread";
import type { Conversation, Message, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAdmin();
  if (!ctx) redirect("/admin");

  const { data: conversation } = await ctx.supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle<Conversation>();
  if (!conversation) redirect("/admin/conversations");

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("*")
    .eq("id", conversation.user_id)
    .maybeSingle<Profile>();

  const { data: messages } = await ctx.supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  return (
    <AdminThread
      conversation={conversation}
      customer={profile}
      initialMessages={messages ?? []}
    />
  );
}
