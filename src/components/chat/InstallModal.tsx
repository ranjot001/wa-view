"use client";

import { useRouter } from "next/navigation";
import { LogoTile } from "@/components/ui/Logo";
import { CheckCircleIcon, CloseIcon, DownloadIcon } from "@/components/ui/Icons";
import { promptInstall, usePwaInstall } from "@/lib/pwa";

// "Take <book> with you" popup shown over the chat until the app is installed.
export function InstallModal({ bookName, onClose }: { bookName: string; onClose: () => void }) {
  const router = useRouter();
  const pwa = usePwaInstall();

  async function install() {
    if (pwa.canPrompt) {
      const outcome = await promptInstall();
      if (outcome !== "unavailable") return onClose();
    }
    // iPhone / browsers without an install API: step-by-step guide.
    router.push("/install");
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Install ${bookName}`}
        onClick={(e) => e.stopPropagation()}
        className="pop-in relative w-full max-w-[460px] rounded-[28px] bg-white px-6 pb-6 pt-8 text-center text-neutral-900 shadow-2xl sm:px-8"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          aria-label="Close"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="flex justify-center">
          <LogoTile size={64} rounded="rounded-2xl" />
        </div>
        <span className="mt-4 inline-block rounded-full bg-[var(--olive-soft)] px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[var(--olive)]">
          OFFICIAL APP
        </span>
        <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-[28px]">
          Take {bookName} with you
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-neutral-500">
          Install the app for faster, easier access to your support chats.
        </p>

        <ul className="mx-auto mt-5 w-fit space-y-2.5 text-left text-[15px] text-neutral-800">
          <li className="flex items-center gap-2.5">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-[var(--olive)]" /> Open chats directly from your home screen
          </li>
          <li className="flex items-center gap-2.5">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-[var(--olive)]" /> Get a smoother app experience
          </li>
        </ul>

        <button
          onClick={install}
          className="mt-6 flex w-full items-center justify-center gap-2 btn-gold rounded-full px-5 py-4 text-[17px] font-bold"
        >
          <DownloadIcon className="h-5 w-5" /> Install {bookName}
        </button>
        <p className="mt-3 text-xs text-neutral-500">Your chats stay available while the app installs.</p>
      </div>
    </div>
  );
}
