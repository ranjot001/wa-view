import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { settingsSchema } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { bookName, supportName, welcomeMessage } = parsed.data;

  const { error } = await createAdminClient()
    .from("app_settings")
    .upsert({
      id: 1,
      book_name: bookName,
      support_name: supportName,
      welcome_message: welcomeMessage,
      updated_at: new Date().toISOString(),
      updated_by: ctx.user.id,
    });
  if (error) {
    console.error("[api/admin/settings]", error.message);
    const missing = /app_settings/.test(error.message);
    return NextResponse.json(
      { error: missing ? "Run supabase/migrations/0004_app_settings.sql first" : "Could not save" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
