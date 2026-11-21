"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoTile } from "@/components/ui/Logo";
import { BackIcon, PhoneIcon } from "@/components/ui/Icons";
import type { ConversationStatus } from "@/lib/types";

export function ChatHeader({
  bookName,
  supportName,
  status,
  onCall,
}: {
  bookName: string;
  supportName: string;
  status: ConversationStatus;
  onCall: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const online = status === "human";

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/verify");
    router.refresh();
  }

  return (
    <header className="flex items-center gap-2.5 border-b border-neutral-200 bg-white px-2 py-2 md:gap-3 md:px-4">
      {/* Mobile: back arrow opens the social links page (desktop has the left rail). */}
      <Link href="/links" className="rounded-full p-1.5 text-neutral-600 hover:bg-neutral-100 md:hidden" aria-label="Links">
        <BackIcon className="h-5 w-5" />
      </Link>
      <span className="hidden sm:block"><LogoTile size={44} /></span>
      <span className="sm:hidden"><LogoTile size={38} /></span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[16px] font-bold text-neutral-900 md:text-lg">{bookName}</p>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500 md:text-sm">
          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-neutral-400"}`} />
          <span className="truncate">
            {status === "closed" ? "Chat closed" : online ? "Online" : "Away"} · 💻 {supportName}
          </span>
        </p>
      </div>
      <button
        onClick={logout}
        className="rounded-full bg-neutral-100 px-2.5 py-1.5 text-[13px] font-semibold sm:px-3 sm:py-2 sm:text-sm text-neutral-800 hover:bg-neutral-200 md:px-5 md:py-2.5 md:text-base"
      >
        Logout
      </button>
      <button
        onClick={onCall}
        className="flex items-center gap-1.5 rounded-full bg-[var(--call-green)] p-2.5 text-sm font-bold sm:px-3 sm:py-2 text-white shadow-md hover:brightness-105 md:px-5 md:py-2.5 md:text-base"
        title="Voice call support"
        aria-label="Call"
      >
        <PhoneIcon className="h-4 w-4 md:h-5 md:w-5" /> <span className="hidden sm:inline">Call</span>
      </button>
    </header>
  );
}
