"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoBadge } from "@/components/ui/Logo";
import { BackIcon, PhoneIcon } from "@/components/ui/Icons";
import { BRAND } from "@/lib/env";
import type { ConversationStatus } from "@/lib/types";

const statusLabel: Record<ConversationStatus, string> = {
  bot: "online",
  pending_human: "connecting to agent…",
  human: "agent online",
  closed: "chat closed",
};

export function ChatHeader({ status }: { status: ConversationStatus }) {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/verify");
    router.refresh();
  }

  return (
    <header className="flex items-center gap-3 bg-[var(--wa-header)] px-3 py-2.5 text-white shadow">
      <button onClick={logout} className="p-1 md:hidden" aria-label="Back">
        <BackIcon className="h-5 w-5" />
      </button>
      <LogoBadge size={40} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate font-semibold">{BRAND.name}</p>
        <p className="flex items-center gap-1.5 text-xs text-emerald-100/80">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
          {statusLabel[status]}
        </p>
      </div>
      <button
        className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
        title="Voice call (coming soon)"
      >
        <PhoneIcon className="h-4 w-4" /> Call
      </button>
      <button
        onClick={logout}
        className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
      >
        Logout
      </button>
    </header>
  );
}
