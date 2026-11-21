"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoBadge } from "@/components/ui/Logo";

// Admins sign in with email + password (created in Supabase → Authentication → Users).
// The customer number-only login refuses admin accounts.
export function AdminLogin() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) return setError("Enter email and password");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return setError("Wrong email or password");
    router.refresh();
  }

  const field =
    "w-full rounded-xl border border-[var(--brand-gold)]/30 bg-black/40 px-3 py-3 text-white outline-none placeholder:text-neutral-500 focus:border-[var(--brand-gold)]/70";

  return (
    <main className="brand-bg flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={signIn}
        className="w-full max-w-sm rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-card)] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <LogoBadge size={40} />
          <div>
            <h1 className="font-semibold text-[var(--brand-gold)]">Admin Console</h1>
            <p className="text-xs text-neutral-400">Support team sign-in</p>
          </div>
        </div>

        <input
          type="email"
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin email"
          className={field}
        />
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={`${field} mt-3`}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl btn-gold px-4 py-3 font-bold"
        >
          {loading ? "Please wait…" : "Sign in"}
        </button>
        {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}
      </form>
    </main>
  );
}
