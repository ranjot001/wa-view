"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/ui/Icons";
import { DEFAULT_WELCOME, type AppSettings } from "@/lib/settings";

export function AdminSettings({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof AppSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setS((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ ok: false, text: data.error || "Could not save" });
    setMsg({ ok: true, text: "Saved — new chats will use this." });
    router.refresh();
  }

  const preview = s.welcomeMessage.replaceAll("{book}", s.bookName || "BOOK");
  const label = "mb-1 block text-sm font-semibold text-neutral-700";
  const input =
    "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none focus:border-[var(--olive)]";

  return (
    <main className="min-h-dvh bg-[#f5f5f0] text-neutral-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link href="/admin/conversations" className="rounded-full p-1.5 hover:bg-neutral-100" aria-label="Back">
          <BackIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold">Settings</h1>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-2">
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <label className={label}>Book name</label>
            <input className={input} value={s.bookName} onChange={set("bookName")} maxLength={40} />
            <p className="mt-1 text-xs text-neutral-500">
              Shown in the chat header, install popup and app name. Used wherever the message says {"{book}"}.
            </p>
          </div>
          <div>
            <label className={label}>Support chat name</label>
            <input className={input} value={s.supportName} onChange={set("supportName")} maxLength={40} />
            <p className="mt-1 text-xs text-neutral-500">The chat customers see in their list, e.g. &quot;Chat started with …&quot;.</p>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-700">Automatic welcome message</label>
              <button
                onClick={() => setS((p) => ({ ...p, welcomeMessage: DEFAULT_WELCOME }))}
                className="text-xs font-medium text-[var(--olive)] hover:underline"
              >
                Reset to default
              </button>
            </div>
            <textarea
              className={`${input} min-h-72 font-[inherit] leading-relaxed`}
              value={s.welcomeMessage}
              onChange={set("welcomeMessage")}
              maxLength={2000}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Sent automatically when a customer starts a chat. Type {"{book}"} to insert the book name.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-[var(--olive)] px-6 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-neutral-700">Preview</p>
          <div className="chat-doodle rounded-2xl p-4 shadow-sm">
            <div className="mb-3 flex justify-center">
              <span className="rounded-lg bg-[var(--sys-chip)] px-3 py-1 text-xs text-neutral-700 shadow-sm">
                Chat started with 💻 {s.supportName}
              </span>
            </div>
            <div className="max-w-[90%] rounded-xl rounded-tl-none bg-white px-3 py-2 text-[14px] shadow-sm">
              <p className="mb-1 text-[12px] font-semibold text-neutral-800">{s.bookName}</p>
              <p className="whitespace-pre-wrap break-words">{preview}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
