"use client";

import { useRef, useState } from "react";
import { EmojiIcon, AttachIcon, CameraIcon, SendIcon } from "@/components/ui/Icons";
import { VoiceRecorder } from "./VoiceRecorder";

const QUICK_EMOJIS = ["👍", "🙏", "😊", "🔥", "✅", "❤️", "😂", "🎮"];

export function Composer({
  onSendText,
  onSendFile,
  onSendVoice,
  disabled,
  placeholder = "Type a message…",
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
  const imgRef = useRef<HTMLInputElement>(null);

  function send() {
    const t = text.trim();
    if (!t) return;
    onSendText(t);
    setText("");
  }

  return (
    <div className="relative bg-[#f0f2f5] px-2 py-2">
      {showEmoji && (
        <div className="absolute bottom-full left-2 mb-2 flex gap-1 rounded-xl bg-white p-2 shadow-lg">
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

      <div className="flex items-end gap-1.5">
        <div className="flex flex-1 items-center gap-1 rounded-full bg-white px-2 py-1 shadow-sm">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="p-1 text-neutral-500 hover:text-[var(--wa-header)]"
            title="Emoji"
          >
            <EmojiIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="p-1 text-neutral-500 hover:text-[var(--wa-header)] disabled:opacity-50"
            title="Attach file"
          >
            <AttachIcon className="h-5 w-5 -rotate-45" />
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
            placeholder={placeholder}
            className="max-h-28 flex-1 resize-none bg-transparent py-1.5 text-[15px] text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <button
            onClick={() => imgRef.current?.click()}
            disabled={disabled}
            className="p-1 text-neutral-500 hover:text-[var(--wa-header)] disabled:opacity-50"
            title="Send image"
          >
            <CameraIcon className="h-5 w-5" />
          </button>
        </div>

        {text.trim() ? (
          <button
            onClick={send}
            disabled={disabled}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--wa-header)] text-white shadow disabled:opacity-50"
            title="Send"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--wa-header)] text-white shadow">
            <VoiceRecorder onComplete={onSendVoice} disabled={disabled} />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSendFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={imgRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSendFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
