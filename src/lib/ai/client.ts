import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import type { Message } from "@/lib/types";
import { HANDOFF_KEYWORDS, HANDOFF_MARKER, SYSTEM_PROMPT } from "./systemPrompt";

export interface BotResult {
  text: string;
  handoff: boolean;
}

// Build Anthropic messages from recent conversation history.
function toAnthropicMessages(history: Message[]): Anthropic.MessageParam[] {
  return history
    .filter((m) => (m.body && m.body.trim()) || m.media_type)
    .map((m) => ({
      role: m.sender_type === "user" ? ("user" as const) : ("assistant" as const),
      content: m.body?.trim() || `[${m.media_type} message]`,
    }));
}

export function keywordHandoff(text: string): boolean {
  const lower = text.toLowerCase();
  return HANDOFF_KEYWORDS.some((k) => lower.includes(k));
}

// Generate a bot reply for the latest user turn. `history` must be chronological
// and already include the newest user message.
export async function generateBotReply(history: Message[]): Promise<BotResult> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey() });

  const resp = await client.messages.create({
    model: env.anthropicModel(),
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: toAnthropicMessages(history),
  });

  const raw = resp.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  const handoff = raw.includes(HANDOFF_MARKER);
  const text = raw.replace(HANDOFF_MARKER, "").trim() ||
    "Let me connect you with a support agent.";

  return { text, handoff };
}
