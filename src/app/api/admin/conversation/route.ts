import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { conversationActionSchema } from "@/lib/validation";
import type { ConversationStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = conversationActionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { conversationId, action } = parsed.data;

  const patch: { status: ConversationStatus; assigned_admin?: string | null } =
    action === "claim"
      ? { status: "human", assigned_admin: ctx.user.id }
      : action === "release"
        ? { status: "bot", assigned_admin: null }
        : action === "close"
          ? { status: "closed" }
          : { status: "bot" }; // reopen

  const admin = createAdminClient();
  const { error } = await admin
    .from("conversations")
    .update(patch)
    .eq("id", conversationId);

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true, status: patch.status });
}
