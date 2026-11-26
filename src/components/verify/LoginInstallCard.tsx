"use client";

import { useRouter } from "next/navigation";
import { LogoTile } from "@/components/ui/Logo";
import { DownloadIcon } from "@/components/ui/Icons";
import { promptInstall, usePwaInstall } from "@/lib/pwa";

// "Get the app" strip on the login screen. On Chrome/Edge it opens the native one-tap
// install dialog directly; where browsers have no install API (iPhone) it opens the guide.
export function LoginInstallCard({ bookName }: { bookName: string }) {
  const router = useRouter();
  const pwa = usePwaInstall();
  if (!pwa.ready || pwa.installed) return null;

  async function install() {
    if (pwa.canPrompt) {
      const outcome = await promptInstall();
      if (outcome !== "unavailable") return;
    }
    router.push("/install");
  }

  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[var(--brand-gold)]/25 bg-black/30 px-3 py-2.5">
      <LogoTile size={40} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-bold text-[var(--brand-gold)]">{bookName} App</p>
        <p className="truncate text-xs text-neutral-400">Home screen par add karein</p>
      </div>
      <button
        onClick={install}
        className="flex shrink-0 items-center gap-1.5 btn-gold rounded-full px-4 py-2 text-sm font-bold"
      >
        <DownloadIcon className="h-4 w-4" /> Install
      </button>
    </div>
  );
}
