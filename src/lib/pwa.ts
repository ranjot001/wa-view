"use client";

import { useEffect, useState } from "react";

// PWA install helpers. The browser fires `beforeinstallprompt` once, often before the
// install screen mounts, so we capture it globally (see ServiceWorker.tsx) and let any
// component read it through usePwaInstall().

export interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type Platform = "ios" | "ios-inapp" | "android" | "desktop";

const INSTALLED_KEY = "sprinter:installed";

let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function initPwaCapture() {
  // Pick up an event the inline <head> script caught before hydration.
  const early = (window as Window & { __bip?: BIPEvent }).__bip;
  if (early && !isStandalone()) {
    deferred = early;
    notify();
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    markInstalled();
    notify();
  });
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {}
}

function wasInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) {
    // In-app browsers (Instagram, Facebook, WhatsApp…) can't add to home screen.
    return /FBAN|FBAV|Instagram|Line\/|WhatsApp|Snapchat|Telegram/i.test(ua) ? "ios-inapp" : "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

// Shows the native install dialog. Must be called directly inside a click handler.
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const ev = deferred;
  if (!ev) return "unavailable";
  deferred = null; // a prompt event can only be used once
  notify();
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  if (outcome === "accepted") markInstalled();
  return outcome;
}

export function usePwaInstall() {
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    setReady(true);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    ready, // false during SSR / first render — don't branch UI on the fields below until true
    canPrompt: !!deferred,
    standalone: ready && isStandalone(),
    installed: ready && (isStandalone() || wasInstalled()),
    platform: (ready ? detectPlatform() : "desktop") as Platform,
  };
}
