"use client";

import { useEffect, useState } from "react";
import { LogoBadge } from "@/components/ui/Logo";
import { DownloadIcon } from "@/components/ui/Icons";

// PWA install prompt banner (matches the reference "Install" banner).
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (hidden || !deferred) return null;

  return (
    <div className="flex items-center gap-3 border-b border-black/5 bg-white px-3 py-2">
      <LogoBadge size={34} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-[var(--wa-header)]">
          Sprinter Customer Care App
        </p>
        <p className="truncate text-xs text-neutral-500">
          Tap karein — app turant install ho jayega
        </p>
      </div>
      <button
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        <DownloadIcon className="h-4 w-4" /> Install
      </button>
      <button onClick={() => setHidden(true)} className="px-1 text-neutral-400" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
