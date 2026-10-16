import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { env } from "@/lib/env";
import { getOtpSender } from "@/lib/otp/sender";

export const runtime = "nodejs";

// Supabase "Send SMS" Auth Hook.
// Supabase generates/expires/verifies the OTP; this endpoint only DELIVERS it,
// here over WhatsApp via the configured provider-agnostic sender.
//
// Payload shape: { user: { phone }, sms: { otp } } — signed with Standard Webhooks.
export async function POST(req: Request) {
  const raw = await req.text();

  // Verify the signature so only Supabase can trigger a send.
  try {
    const secret = env.authHookSecret().replace(/^v1,whsec_/, "").replace(/^whsec_/, "");
    const wh = new Webhook(secret);
    const headers = {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
    };
    wh.verify(raw, headers);
  } catch (e) {
    console.error("[otp-hook] signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const phoneRaw = payload.user?.phone;
  const otp = payload.sms?.otp;
  if (!phoneRaw || !otp) {
    return NextResponse.json({ error: "Missing phone or otp" }, { status: 400 });
  }
  const phone = phoneRaw.startsWith("+") ? phoneRaw : `+${phoneRaw}`;

  try {
    await getOtpSender().send(phone, otp);
  } catch (e) {
    console.error("[otp-hook] delivery failed:", e);
    return NextResponse.json({ error: "Delivery failed" }, { status: 502 });
  }

  // Empty 200 tells Supabase the message was handled by this hook.
  return NextResponse.json({});
}
