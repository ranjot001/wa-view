import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminConversationList } from "@/components/admin/AdminConversationList";
import type { ConversationWithProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminConversationsPage() {
  const ctx = await requireAdmin();
  if (!ctx) redirect("/admin");

  const { data } = await ctx.supabase
    .from("conversations")
    .select("*, profile:profiles!conversations_user_id_fkey(id,phone,display_name)")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .returns<ConversationWithProfile[]>();

  return (
    <AdminConversationList
      initial={data ?? []}
      adminName={ctx.profile.display_name || ctx.profile.phone || "Admin"}
    />
  );
}
