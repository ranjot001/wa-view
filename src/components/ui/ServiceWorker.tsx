"use client";

import { useEffect } from "react";
import { initPwaCapture } from "@/lib/pwa";

// Registers the PWA service worker and starts capturing the install prompt early.
export function ServiceWorker() {
  useEffect(() => {
    initPwaCapture();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
