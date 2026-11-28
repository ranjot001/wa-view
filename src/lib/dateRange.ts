// Date-range helpers for the admin inbox. All ranges are in the viewer's local timezone
// and are half-open: [from, to).

export type RangePreset = "any" | "today" | "yesterday" | "7d" | "30d" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// "YYYY-MM-DD" (what <input type="date"> uses) <-> local Date
export function toInputDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function fromInputDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}

// Custom range: both ends are inclusive calendar days.
export function presetRange(preset: RangePreset, customFrom?: string, customTo?: string): DateRange | null {
  const today = startOfDay(new Date());
  switch (preset) {
    case "today":
      return { from: today, to: addDays(today, 1) };
    case "yesterday":
      return { from: addDays(today, -1), to: today };
    case "7d":
      return { from: addDays(today, -6), to: addDays(today, 1) };
    case "30d":
      return { from: addDays(today, -29), to: addDays(today, 1) };
    case "custom": {
      const f = customFrom ? fromInputDate(customFrom) : null;
      const t = customTo ? fromInputDate(customTo) : f;
      if (!f || !t) return null;
      const [a, b] = f <= t ? [f, t] : [t, f];
      return { from: a, to: addDays(b, 1) };
    }
    default:
      return null;
  }
}

export function rangeLabel(r: DateRange): string {
  const fmt = (d: Date) => d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  const last = addDays(r.to, -1);
  return toInputDate(r.from) === toInputDate(last) ? fmt(r.from) : `${fmt(r.from)} – ${fmt(last)}`;
}

// File-name friendly: "2026-11-28" or "2026-11-01_to_2026-11-28"
export function rangeSlug(r: DateRange): string {
  const last = addDays(r.to, -1);
  const a = toInputDate(r.from);
  const b = toInputDate(last);
  return a === b ? a : `${a}_to_${b}`;
}

// Build a CSV (UTF-8 with BOM so Excel shows non-English names correctly) and download it.
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
