"use client";

import { useEffect, useState } from "react";
import { dayLabel, formatTime } from "@/lib/format";

// True only after the first client render. Anything that depends on the viewer's
// timezone must wait for this: the server renders in UTC (Vercel), the browser in the
// customer's local time, and rendering both would cause a hydration mismatch.
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// A timestamp shown in the viewer's local timezone ("14:05", or "Today"/"Yesterday"/date).
export function LocalTime({ iso, as = "time" }: { iso: string; as?: "time" | "day" }) {
  const mounted = useMounted();
  return <time dateTime={iso}>{mounted ? (as === "day" ? dayLabel(iso) : formatTime(iso)) : ""}</time>;
}
