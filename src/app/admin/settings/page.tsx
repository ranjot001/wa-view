import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminSettings } from "@/components/admin/AdminSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await requireAdmin())) redirect("/admin");
  return <AdminSettings initial={await getSettings()} />;
}
