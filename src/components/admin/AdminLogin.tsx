"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nationalPhoneSchema, otpSchema, toE164 } from "@/lib/validation";
import { LogoBadge } from "@/components/ui/Logo";

export function AdminLogin({ countryCode }: { countryCode: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e164 = toE164(phone, countryCode);

  async function requestOtp() {
    setError(null);
    const p = nationalPhoneSchema.safeParse(phone);
    if (!p.success) return setError(p.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (error) return setError(error.message);
    setStep("otp");
  }

  async function verify() {
    setError(null);
    const p = otpSchema.safeParse(code);
    if (!p.success) return setError(p.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: e164, token: code, type: "sms" });
    setLoading(false);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <main className="brand-bg flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <LogoBadge size={40} />
          <div>
            <h1 className="font-semibold text-[var(--brand-gold)]">Admin Console</h1>
            <p className="text-xs text-neutral-400">Sprinter Customer Care</p>
          </div>
        </div>

        {step === "phone" ? (
          <div className="flex overflow-hidden rounded-xl border border-[var(--brand-gold)]/30 bg-black/40">
            <span className="flex items-center bg-black/50 px-3 text-sm font-semibold text-[var(--brand-gold)]">{countryCode}</span>
            <input
              inputMode="numeric"
              maxLength={10}
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && requestOtp()}
              placeholder="Admin mobile"
              className="w-full bg-transparent px-3 py-3 text-white outline-none placeholder:text-neutral-500"
            />
          </div>
        ) : (
          <input
            inputMode="numeric"
            maxLength={8}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && verify()}
            placeholder="Enter OTP"
            className="w-full rounded-xl border border-[var(--brand-gold)]/30 bg-black/40 px-3 py-3 text-center text-xl tracking-[0.4em] text-white outline-none"
          />
        )}

        <button
          onClick={step === "phone" ? requestOtp : verify}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-gradient-to-b from-[var(--wa-green)] to-[var(--wa-green-deep)] px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Please wait…" : step === "phone" ? "Send OTP" : "Verify"}
        </button>
        {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}
      </div>
    </main>
  );
}
