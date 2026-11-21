import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Customer sign-in by mobile number only (no OTP). The number is NOT verified — anyone
// who types a number gets that number's chat. Admin accounts can never sign in this way;
// they use email + password on /admin.
//
// Finds or creates the phone user, rotates it to a fresh random password, and signs in
// on the server so the session cookies land on the response.
export async function signInByPhone(e164: string): Promise<{ error?: string; status?: number }> {
  const admin = createAdminClient();
  const password = randomBytes(24).toString("base64url");
  const digits = e164.replace(/^\+/, "");
  // Sign in by a synthetic email: the email provider is on by default, phone+password isn't.
  const email = `p${digits}@sprinter.local`;

  // Existing account? profiles.phone may be stored with or without the "+".
  const { data: profile } = await admin
    .from("profiles")
    .select("id, is_admin")
    .in("phone", [e164, digits])
    .limit(1)
    .maybeSingle<{ id: string; is_admin: boolean }>();

  if (profile?.is_admin) {
    return { error: "This number can't be used here.", status: 403 };
  }

  if (profile) {
    const { error } = await admin.auth.admin.updateUserById(profile.id, {
      password,
      email,
      email_confirm: true,
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.auth.admin.createUser({
      phone: e164,
      phone_confirm: true,
      email,
      email_confirm: true,
      password,
    });
    if (error) return { error: error.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return {};
}
