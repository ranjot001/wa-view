import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const ctx = await requireAdmin();
  if (ctx) redirect("/admin/conversations");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <main className="brand-bg flex min-h-dvh items-center justify-center px-4 text-center">
        <div className="max-w-sm rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-card)] p-6">
          <h1 className="text-lg font-semibold text-[var(--brand-gold)]">Not authorized</h1>
          <p className="mt-2 text-sm text-neutral-400">
            This account doesn&apos;t have admin access. Ask an administrator to enable it, then sign in again.
          </p>
          <div className="mt-4"><SignOutButton /></div>
        </div>
      </main>
    );
  }

  return <AdminLogin countryCode={env.defaultCountryCode()} />;
}
