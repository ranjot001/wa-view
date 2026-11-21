"use client";

import { LogoTile } from "@/components/ui/Logo";
import { CheckCircleIcon, DownloadIcon } from "@/components/ui/Icons";
import { usePwaInstall } from "@/lib/pwa";

// "<book> App — Tap Install" strip under the chat header.
export function InstallBanner({ bookName, onInstall }: { bookName: string; onInstall: () => void }) {
  const pwa = usePwaInstall();
  if (!pwa.ready) return null;

  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2 md:px-4">
      <LogoTile size={40} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[15px] font-bold text-[var(--olive)] md:text-lg">{bookName} App</p>
        <p className="truncate text-xs text-neutral-500 md:text-sm">
          {pwa.installed ? "Installed — open it from your home screen" : "Tap Install — the app installs instantly"}
        </p>
      </div>
      {pwa.installed ? (
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-600">
          <CheckCircleIcon className="h-4 w-4" /> Installed
        </span>
      ) : (
        <button
          onClick={onInstall}
          className="flex items-center gap-1.5 rounded-full bg-[var(--call-green)] px-4 py-2 text-sm font-bold text-white shadow-md hover:brightness-105 md:px-5 md:py-2.5 md:text-base"
        >
          <DownloadIcon className="h-4 w-4 md:h-5 md:w-5" /> Install
        </button>
      )}
    </div>
  );
}
