"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppIcon, BackIcon } from "@/components/ui/Icons";
import { nationalPhoneSchema, otpSchema, toE164 } from "@/lib/validation";
import { BRAND } from "@/lib/env";

type Step = "phone" | "otp";

export function VerifyClient({ countryCode }: { countryCode: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const e164 = toE164(phone, countryCode);

  async function requestOtp() {
    setError(null);
    const parsed = nationalPhoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("otp");
  }

  async function verifyOtp() {
    setError(null);
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: code,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/chat");
    router.refresh();
  }

  return (
    <main className="brand-bg min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-card)]/90 p-7 shadow-2xl backdrop-blur">
        <div className="flex justify-center pb-2">
          <Logo size={190} />
        </div>
        <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-[var(--brand-gold)]/40 to-transparent" />

        <h1 className="text-center text-2xl font-bold text-[var(--brand-gold)]">
          {BRAND.name}
        </h1>
        <p className="mt-1 text-center text-sm text-neutral-400">
          {step === "phone" ? BRAND.subtitle : `Enter the code sent to ${e164}`}
        </p>

        {step === "phone" ? (
          <>
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
                onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                placeholder="10-digit mobile"
                className="w-full bg-transparent px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 outline-none"
              />
            </div>

            <button
              onClick={requestOtp}
              disabled={loading}
              className="rec-pulse mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[var(--wa-green)] to-[var(--wa-green-deep)] px-4 py-3.5 font-semibold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {loading ? "Sending…" : "Get OTP on WhatsApp"}
            </button>
          </>
        ) : (
          <>
            <input
              inputMode="numeric"
              autoFocus
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              placeholder="••••••"
              className="mt-6 w-full rounded-2xl border border-[var(--brand-gold)]/30 bg-black/40 px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-[var(--brand-gold)]/70"
            />
            <button
              onClick={verifyOtp}
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-gradient-to-b from-[var(--wa-green)] to-[var(--wa-green-deep)] px-4 py-3.5 font-semibold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
            <button
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="mx-auto mt-3 flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200"
            >
              <BackIcon className="h-4 w-4" /> Change number
            </button>
          </>
        )}

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
