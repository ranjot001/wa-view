"use client";

import { useRef, useState } from "react";
import { PlayIcon, PauseIcon } from "@/components/ui/Icons";

export function VoiceMessage({ src, mine }: { src: string; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex min-w-[180px] items-center gap-3">
      <button
        onClick={toggle}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
          mine ? "bg-[var(--wa-green-deep)]" : "bg-[var(--wa-header)]"
        }`}
      >
        {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
      </button>
      <div className="flex-1">
        <div className="h-1 w-full rounded-full bg-black/15">
          <div
            className="h-1 rounded-full bg-[var(--wa-header)]"
            style={{ width: `${dur ? (progress / dur) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-neutral-500">
          {fmt(playing || progress ? progress : dur)}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />
    </div>
  );
}
