"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  const router = useRouter();
  const supabase = createClient();
  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.refresh();
      }}
      className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
    >
      {label}
    </button>
  );
}
