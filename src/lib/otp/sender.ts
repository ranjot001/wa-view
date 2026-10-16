// Provider-agnostic WhatsApp OTP delivery.
//
// Supabase generates/expires/verifies the code (via the Send-SMS Auth Hook);
// this module only DELIVERS the code to the user's WhatsApp. Swap providers with
// the OTP_PROVIDER env var without touching any calling code.

import { env } from "@/lib/env";

export interface WhatsAppOtpSender {
  readonly name: string;
  send(phone: string, code: string): Promise<void>;
}

/** Dev/default: logs the code to the server console so the flow is testable
 *  without any vendor account. */
class MockSender implements WhatsAppOtpSender {
  readonly name = "mock";
  async send(phone: string, code: string): Promise<void> {
    console.log(
      `\n[OTP:mock] WhatsApp code for ${phone} => ${code}  (set OTP_PROVIDER to a real provider for production)\n`
    );
  }
}

/** WhatsApp Business Cloud API (Meta). Requires an approved authentication
 *  template and a verified sender. */
class CloudApiSender implements WhatsAppOtpSender {
  readonly name = "cloud_api";
  async send(phone: string, code: string): Promise<void> {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_TOKEN;
    const template = process.env.WHATSAPP_TEMPLATE_NAME || "otp_verification";
    const lang = process.env.WHATSAPP_TEMPLATE_LANG || "en";
    if (!phoneId || !token) {
      throw new Error("CloudApiSender missing WHATSAPP_PHONE_ID / WHATSAPP_TOKEN");
    }
    const to = phone.replace(/^\+/, "");
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: lang },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`CloudApiSender failed (${res.status}): ${await res.text()}`);
    }
  }
}

/** Twilio WhatsApp (plain message with the code). For Twilio's own Verify
 *  product you would instead let Twilio own the code lifecycle. */
class TwilioSender implements WhatsAppOtpSender {
  readonly name = "twilio";
  async send(phone: string, code: string): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+1415..."
    if (!sid || !token || !from) {
      throw new Error("TwilioSender missing TWILIO_* env vars");
    }
    const body = new URLSearchParams({
      To: `whatsapp:${phone}`,
      From: from,
      Body: `Your ${process.env.NEXT_PUBLIC_APP_NAME || "Sprinter Care"} verification code is ${code}. It expires shortly.`,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );
    if (!res.ok) {
      throw new Error(`TwilioSender failed (${res.status}): ${await res.text()}`);
    }
  }
}

export function getOtpSender(): WhatsAppOtpSender {
  switch (env.otpProvider()) {
    case "cloud_api":
      return new CloudApiSender();
    case "twilio":
      return new TwilioSender();
    case "mock":
    default:
      return new MockSender();
  }
}
