import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerifyClient } from "@/components/verify/VerifyClient";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/chat");

  return <VerifyClient countryCode={env.defaultCountryCode()} />;
}
