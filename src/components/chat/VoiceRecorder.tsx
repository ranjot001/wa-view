"use client";

import { useRef, useState } from "react";
import { MicIcon, SendIcon } from "@/components/ui/Icons";

// Records a voice note via MediaRecorder and hands the Blob to onComplete.
export function VoiceRecorder({
  onComplete,
  disabled,
}: {
  onComplete: (blob: Blob) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) onComplete(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      alert("Microphone permission is required to record a voice note.");
    }
  }

  function stop(send: boolean) {
    if (timerRef.current) clearInterval(timerRef.current);
    const mr = mediaRef.current;
    if (!mr) return;
    if (!send) {
      mr.ondataavailable = null;
      chunksRef.current = [];
    }
    mr.stop();
    setRecording(false);
  }

  const fmt = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  if (recording) {
    return (
      <div className="flex items-center gap-3 px-1">
        <button onClick={() => stop(false)} className="text-sm text-red-500" title="Cancel">
          ✕
        </button>
        <span className="flex items-center gap-2 text-sm text-red-500">
          <span className="rec-pulse inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          {fmt}
        </span>
        <button
          onClick={() => stop(true)}
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--wa-green)] text-white"
          title="Send voice note"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={start}
      disabled={disabled}
      className="p-1 text-neutral-500 hover:text-[var(--wa-header)] disabled:opacity-50"
      title="Record voice note"
    >
      <MicIcon className="h-6 w-6" />
    </button>
  );
}
