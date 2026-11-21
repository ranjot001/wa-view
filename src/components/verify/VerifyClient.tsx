"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ChatBubbleIcon } from "@/components/ui/Icons";
import { nationalPhoneSchema } from "@/lib/validation";
import { BRAND } from "@/lib/env";

// Customer entry: mobile number only (no OTP), then straight into the chat.
export function VerifyClient({ countryCode, bookName }: { countryCode: string; bookName: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    const parsed = nationalPhoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      setLoading(false);
      const { error } = await res.json().catch(() => ({ error: "Sign-in failed" }));
      setError(error || "Sign-in failed");
      return;
    }
    router.replace("/install");
    router.refresh();
  }

  return (
    <main className="brand-bg min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-card)]/90 p-7 shadow-2xl backdrop-blur">
        <div className="flex justify-center pb-2">
          <Logo size={190} />
        </div>
        <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-[var(--brand-gold)]/40 to-transparent" />

        <h1 className="text-gold text-center text-2xl font-extrabold tracking-wide">
          {bookName}
        </h1>
        <p className="mt-1 text-center text-sm text-neutral-400">{BRAND.subtitle}</p>

        <div className="mt-6 flex items-stretch overflow-hidden rounded-2xl border border-[var(--brand-gold)]/30 bg-black/40 focus-within:border-[var(--brand-gold)]/70">
          <span className="flex items-center bg-black/50 px-4 text-sm font-semibold text-[var(--brand-gold)]">
            {countryCode}
          </span>
          <input
            inputMode="numeric"
            autoFocus
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && start()}
            placeholder="10-digit mobile"
            className="w-full bg-transparent px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 outline-none"
          />
        </div>

        <button
          onClick={start}
          disabled={loading}
          className="rec-pulse mt-5 flex w-full items-center justify-center gap-2 rounded-2xl btn-gold px-4 py-3.5 font-bold"
        >
          <ChatBubbleIcon className="h-5 w-5" />
          {loading ? "Starting…" : "Start Chat"}
        </button>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-5 text-xs text-neutral-500">
          <span className="flex items-center gap-1"><Dot /> Secure</span>
          <span className="flex items-center gap-1"><Dot /> 24/7 Support</span>
          <span className="flex items-center gap-1"><Dot /> Instant reply</span>
        </div>
      </div>
    </main>
  );
}

const Dot = () => <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-gold)]" />;
