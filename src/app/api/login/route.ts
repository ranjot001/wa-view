import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { nationalPhoneSchema, toE164 } from "@/lib/validation";
import { signInByPhone } from "@/lib/phoneLogin";
import { clientIp, rateLimit } from "@/lib/security";

export const runtime = "nodejs";

const TOO_MANY = { error: "Too many attempts — please wait a few minutes" };

// Customer sign-in with just a mobile number (see src/lib/phoneLogin.ts).
export async function POST(req: Request) {
  const { phone } = await req.json().catch(() => ({ phone: "" }));
  const p = nationalPhoneSchema.safeParse(phone);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });

  // Per IP: stops scripts from mass-creating accounts. Per number: stops hammering one number.
  if (!(await rateLimit(`login:ip:${clientIp(req)}`, 10, 600))) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }
  if (!(await rateLimit(`login:phone:${p.data}`, 5, 600))) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }

  const { error, status } = await signInByPhone(toE164(p.data, env.defaultCountryCode()));
  if (error) {
    if (status && status < 500) return NextResponse.json({ error }, { status });
    console.error("[api/login]", error);
    return NextResponse.json({ error: "Could not sign in — please try again" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
