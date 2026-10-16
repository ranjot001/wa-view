"use client";

import Image from "next/image";
import type { Message } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { CheckDouble, FileIcon } from "@/components/ui/Icons";
import { VoiceMessage } from "./VoiceMessage";

// `mine` = rendered on the right (current viewer's own side).
export function MessageBubble({ m, mine }: { m: Message; mine: boolean }) {
  return (
    <div className={`flex px-3 ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[78%] rounded-lg px-2.5 py-1.5 text-[14.5px] text-neutral-900 shadow-sm md:max-w-[65%] ${
          mine ? "bubble-out rounded-tr-none bg-[var(--wa-out)]" : "bubble-in rounded-tl-none bg-[var(--wa-in)]"
        }`}
      >
        {m.sender_type === "bot" && !mine && (
          <p className="mb-0.5 text-[11px] font-semibold text-[var(--wa-header)]">Assistant</p>
        )}

        {m.media_type === "image" && m.media_url && (
          <a href={m.media_url} target="_blank" rel="noreferrer" className="block">
            <Image
              src={m.media_url}
              alt="shared image"
              width={260}
              height={260}
              unoptimized
              className="mb-1 max-h-72 w-auto rounded-md object-cover"
            />
          </a>
        )}

        {m.media_type === "audio" && m.media_url && (
          <VoiceMessage src={m.media_url} mine={mine} />
        )}

        {m.media_type === "file" && m.media_url && (
          <a
            href={m.media_url}
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-2 rounded-md bg-black/5 px-3 py-2 text-sm text-neutral-700"
          >
            <FileIcon className="h-5 w-5 shrink-0" />
            <span className="truncate">Attachment</span>
          </a>
        )}

        {m.body && <span className="whitespace-pre-wrap break-words">{m.body}</span>}

        <span className="float-right ml-2 mt-1 flex select-none items-center gap-1 text-[10px] text-neutral-500">
          {formatTime(m.created_at)}
          {mine && (
            <CheckDouble
              className="h-3.5 w-3.5"
              style={{ color: m.read_at ? "var(--wa-tick)" : "#9aa0a6" }}
            />
          )}
        </span>
      </div>
    </div>
  );
}
