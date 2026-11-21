"use client";

import { useRef, useState } from "react";
import { DocIcon, PaperclipIcon, SendIcon, SmileIcon } from "@/components/ui/Icons";
import { VoiceRecorder } from "./VoiceRecorder";

const QUICK_EMOJIS = ["👍", "🙏", "😊", "🔥", "✅", "❤️", "😂", "🎮"];
// Must match the storage bucket's allow-list (migration 0003).
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

export function Composer({
  onSendText,
  onSendFile,
  onSendVoice,
  disabled,
  placeholder = "Type a message...",
}: {
  onSendText: (text: string) => void;
  onSendFile: (file: File) => void;
  onSendVoice: (blob: Blob) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function send() {
    const t = text.trim();
    if (!t || disabled) return;
    onSendText(t);
    setText("");
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return alert("File is too large (max 10 MB)");
    onSendFile(f);
  }

  const iconBtn = "rounded-full p-2 transition hover:bg-neutral-100 disabled:opacity-40";

  return (
    <div className="relative border-t border-neutral-200 bg-white px-2 py-2 md:px-4 md:py-3">
      {showEmoji && (
        <div className="absolute bottom-full left-2 mb-2 flex gap-1 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                setText((t) => t + e);
                setShowEmoji(false);
              }}
              className="rounded-lg px-1.5 py-1 text-xl hover:bg-neutral-100"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-0.5 md:gap-1.5">
        <button onClick={() => setShowEmoji((v) => !v)} className={`${iconBtn} text-amber-500`} title="Emoji">
          <SmileIcon className="h-6 w-6" />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className={`${iconBtn} hidden text-[var(--gold-600)] sm:block`}
          title="Send photo"
        >
          <DocIcon className="h-6 w-6" />
        </button>
        <VoiceRecorder
          onComplete={onSendVoice}
          disabled={disabled}
          className={`${iconBtn} text-rose-500`}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className={`${iconBtn} text-sky-600`}
          title="Attach photo"
        >
          <PaperclipIcon className="h-6 w-6" />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          className="ml-1 max-h-28 min-w-0 flex-1 resize-none rounded-full bg-[var(--cream-100)] px-4 py-2.5 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-500 md:px-5 md:py-3 md:text-base"
        />

        <button
          onClick={send}
          disabled={disabled || !text.trim()}
          className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--call-green)] text-white shadow transition disabled:bg-neutral-200 disabled:text-neutral-400 md:h-12 md:w-12"
          title="Send"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>

      <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={pickFile} />
    </div>
  );
}
