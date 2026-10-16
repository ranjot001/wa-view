import { z } from "zod";

// 10-digit national number (matches the reference "+91 10-digit mobile" field).
export const nationalPhoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, "Enter the code you received");

export const messageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  body: z.string().trim().max(4000).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "audio", "file"]).optional(),
  replyTo: z.string().uuid().optional(),
});

export const adminReplySchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().max(4000).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "audio", "file"]).optional(),
});

export const conversationActionSchema = z.object({
  conversationId: z.string().uuid(),
  action: z.enum(["claim", "release", "close", "reopen"]),
});

// Compose E.164 from a national number + configured country code.
export function toE164(national: string, countryCode: string): string {
  const cc = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
  return `${cc}${national}`;
}
