import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Returns the authenticated admin profile, or null if not an admin / not signed in.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.is_admin) return null;
  return { user, profile, supabase };
}
