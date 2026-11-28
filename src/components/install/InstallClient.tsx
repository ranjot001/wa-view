"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, LogoBadge } from "@/components/ui/Logo";
import {
  CheckCircleIcon,
  DownloadIcon,
  MoreVerticalIcon,
  PlusSquareIcon,
  ShareIOSIcon,
} from "@/components/ui/Icons";
import { markInstalled, promptInstall, usePwaInstall, type Platform } from "@/lib/pwa";

type Phase = "intro" | "loading" | "guide" | "done";

// Step 2 of onboarding: get the app onto the home screen.
// - Chrome/Edge (Android + desktop): native install dialog, with a loading screen behind it.
// - iPhone/iPad Safari (no install API): loading screen, then an "Add to Home Screen" guide.
export function InstallClient({ next = "/chat", bookName }: { next?: string; bookName: string }) {
  const router = useRouter();
  const pwa = usePwaInstall();
  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Already running from the home screen → nothing to install.
  useEffect(() => {
    if (pwa.standalone) router.replace(next);
  }, [pwa.standalone, next, router]);

  useEffect(() => () => stopTimer(), []);

  function stopTimer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  // Animate the progress bar toward `cap` over roughly `ms`.
  function runProgress(cap: number, ms: number, onDone?: () => void) {
    stopTimer();
    const step = 100 / (ms / 40);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(cap, p + step);
        if (n >= cap) {
          stopTimer();
          if (onDone) setTimeout(onDone, 250);
        }
        return n;
      });
    }, 40);
  }

  function install() {
    setNote(null);
    setProgress(0);
    setPhase("loading");

    if (pwa.canPrompt) {
      // Must call prompt() synchronously inside the click for the browser to allow it.
      runProgress(85, 1600);
      promptInstall().then((outcome) => {
        if (outcome === "accepted") {
          runProgress(100, 700, () => setPhase("done"));
        } else {
          stopTimer();
          setPhase("intro");
          setNote("Install cancel ho gaya — dobara try karein.");
        }
      });
      return;
    }

    // No install API (iOS Safari, Firefox, Samsung Internet…) → guide the user.
    runProgress(100, 2200, () => setPhase("guide"));
  }

  function finish() {
    markInstalled();
    setPhase("done");
  }

  const goChat = () => router.replace(next);
  const iosGuide = phase === "guide" && pwa.platform === "ios";

  return (
    <main
      className={`brand-bg flex min-h-dvh flex-col items-center px-4 ${
        iosGuide ? "justify-between pb-2 pt-8" : "justify-center py-10"
      }`}
    >
      <div className="w-full max-w-[420px] rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-card)]/90 p-7 shadow-2xl backdrop-blur">
        {phase === "intro" && (
          <>
            <StepPill n={2} label="Install App" />
            <div className="flex justify-center pt-2">
              <Logo size={260} />
            </div>
            <h1 className="sr-only">{bookName} App</h1>
            <p className="mt-4 text-center text-sm text-neutral-400">
              App ko home screen par add karein — ek tap mein support se baat karein.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-neutral-300">
              <Feature>Instant chat &amp; call with support</Feature>
              <Feature>Home screen se seedha kholein — no login again</Feature>
              <Feature>Light &amp; fast — koi Play Store download nahi</Feature>
            </ul>

            <button
              onClick={install}
              className="rec-pulse mt-7 flex w-full items-center justify-center gap-2 rounded-2xl btn-gold px-4 py-3.5 text-[16px] font-bold transition active:scale-[0.99]"
            >
              <DownloadIcon className="h-5 w-5" /> Install App
            </button>
            {note && (
              <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
                {note}
              </p>
            )}
            <button
              onClick={goChat}
              className="mx-auto mt-4 block text-sm text-neutral-500 hover:text-neutral-300"
            >
              Skip — browser mein continue karein
            </button>
          </>
        )}

        {phase === "loading" && (
          <div className="flex flex-col items-center py-6">
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-[28px] bg-[var(--brand-gold)]/20" />
              <AppIcon size={96} />
            </div>
            <p className="mt-7 text-lg font-semibold text-white">Installing {bookName}…</p>
            <p className="mt-1 text-sm text-neutral-400">
              {progress < 40 ? "Preparing app" : progress < 80 ? "Downloading resources" : "Almost done"}
            </p>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-gold)] to-[var(--wa-green)] transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs tabular-nums text-neutral-500">{Math.round(progress)}%</p>
          </div>
        )}

        {phase === "guide" && <Guide platform={pwa.platform} onDone={finish} onSkip={goChat} bookName={bookName} />}

        {phase === "done" && (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircleIcon className="h-16 w-16 text-[var(--wa-green)]" />
            <h2 className="mt-4 text-xl font-bold text-white">App ready hai!</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Home screen par <span className="font-semibold text-[var(--brand-gold)]">{bookName}</span>{" "}
              icon se kabhi bhi kholein.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-3">
              <AppIcon size={48} />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{bookName}</p>
                <p className="text-xs text-neutral-500">Added to Home Screen</p>
              </div>
            </div>
            <button
              onClick={goChat}
              className="mt-7 w-full rounded-2xl btn-gold px-4 py-3.5 font-bold active:scale-[0.99]"
            >
              Continue to Chat
            </button>
          </div>
        )}
      </div>

      {/* Bouncing pointer toward Safari's bottom-bar Share button. */}
      {iosGuide && (
        <div className="pointer-events-none mt-6 flex flex-col items-center text-[var(--brand-gold)]">
          <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-semibold">Share button yahan hai</span>
          <span className="mt-1 animate-bounce text-2xl">↓</span>
        </div>
      )}
    </main>
  );
}

function Guide({
  platform,
  onDone,
  onSkip,
  bookName,
}: {
  platform: Platform;
  bookName: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const steps: { icon: React.ReactNode; text: React.ReactNode }[] =
    platform === "ios"
      ? [
          { icon: <ShareIOSIcon className="h-5 w-5" />, text: <>Neeche <b>Share</b> button dabayein</> },
          { icon: <PlusSquareIcon className="h-5 w-5" />, text: <>Scroll karke <b>&quot;Add to Home Screen&quot;</b> chunein</> },
          { icon: <CheckCircleIcon className="h-5 w-5" />, text: <>Upar right mein <b>&quot;Add&quot;</b> dabayein</> },
        ]
      : platform === "ios-inapp"
        ? [
            { icon: <MoreVerticalIcon className="h-5 w-5" />, text: <>Upar <b>•••</b> menu dabayein</> },
            { icon: <ShareIOSIcon className="h-5 w-5" />, text: <><b>&quot;Open in Safari&quot;</b> chunein</> },
            { icon: <PlusSquareIcon className="h-5 w-5" />, text: <>Safari mein Share → <b>&quot;Add to Home Screen&quot;</b></> },
          ]
        : platform === "android"
          ? [
              { icon: <MoreVerticalIcon className="h-5 w-5" />, text: <>Upar right <b>⋮</b> menu dabayein</> },
              { icon: <PlusSquareIcon className="h-5 w-5" />, text: <><b>&quot;Add to Home screen&quot;</b> ya <b>&quot;Install app&quot;</b> chunein</> },
              { icon: <CheckCircleIcon className="h-5 w-5" />, text: <><b>&quot;Install&quot;</b> / <b>&quot;Add&quot;</b> confirm karein</> },
            ]
          : [
              { icon: <DownloadIcon className="h-5 w-5" />, text: <>Address bar mein <b>Install</b> icon dabayein</> },
              { icon: <MoreVerticalIcon className="h-5 w-5" />, text: <>Ya browser menu → <b>&quot;Install {bookName}&quot;</b></> },
              { icon: <CheckCircleIcon className="h-5 w-5" />, text: <><b>&quot;Install&quot;</b> confirm karein</> },
            ];

  return (
    <div>
      <div className="flex items-center gap-3">
        <LogoBadge size={44} />
        <div>
          <h2 className="text-lg font-bold text-white">Add to Home Screen</h2>
          <p className="text-xs text-neutral-400">Bas 3 steps — 10 second ka kaam</p>
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-gold)] text-sm font-bold text-black">
              {i + 1}
            </span>
            <span className="flex-1 text-sm text-neutral-200">{s.text}</span>
            <span className="text-[var(--brand-gold)]">{s.icon}</span>
          </li>
        ))}
      </ol>

      <button
        onClick={onDone}
        className="mt-6 w-full rounded-2xl btn-gold px-4 py-3.5 font-bold active:scale-[0.99]"
      >
        Done — maine add kar liya
      </button>
      <button onClick={onSkip} className="mx-auto mt-4 block text-sm text-neutral-500 hover:text-neutral-300">
        Baad mein karunga
      </button>

    </div>
  );
}

// The same artwork the home screen will show (manifest / apple-touch-icon).
function AppIcon({ size }: { size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/icon-512.png"
      alt=""
      width={size}
      height={size}
      className="relative rounded-[24%] shadow-[0_0_40px_rgba(231,193,91,0.25)] ring-1 ring-[var(--brand-gold)]/40"
    />
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <CheckCircleIcon className="h-4.5 w-4.5 shrink-0 text-[var(--wa-green)]" />
      {children}
    </li>
  );
}

function StepPill({ n, label }: { n: number; label: string }) {
  return (
    <div className="mb-4 flex justify-center">
      <span className="rounded-full bg-[var(--brand-gold)]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--brand-gold)]">
        Step {n} · {label}
      </span>
    </div>
  );
}
