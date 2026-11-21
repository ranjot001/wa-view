// Centralised, lazily-read environment access so the app can be imported during
// `next build` without throwing when secrets are absent. Call the getters at
// request time, never at module top-level.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

// NOTE: NEXT_PUBLIC_* vars MUST be read as static literals (process.env.NEXT_PUBLIC_X),
// not via a dynamic key — Next.js only inlines them into the browser bundle when the
// property access is literal. A dynamic lookup returns undefined in the browser.
function requireLiteral(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  // Public (safe in the browser) — literal access so Next inlines them client-side.
  supabaseUrl: () =>
    requireLiteral(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () =>
    requireLiteral(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  defaultCountryCode: () => process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "+91",
  // Optional TURN relay for voice calls (STUN alone fails behind some mobile NATs).
  turnUrl: () => process.env.NEXT_PUBLIC_TURN_URL || "",
  turnUsername: () => process.env.NEXT_PUBLIC_TURN_USERNAME || "",
  turnCredential: () => process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "",

  // Server-only
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicApiKey: () => required("ANTHROPIC_API_KEY"),
  // No key = no AI replies: customers get the admin's welcome message, then an agent.
  hasAnthropicKey: () => !!process.env.ANTHROPIC_API_KEY,
  anthropicModel: () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
  // Social links page (/links). Read on the server at request time; blank = hidden.
  socialLinks: () => ({
    whatsapp: process.env.SOCIAL_WHATSAPP_URL || "",
    telegram: process.env.SOCIAL_TELEGRAM_URL || "",
    instagram: process.env.SOCIAL_INSTAGRAM_URL || "",
    website: process.env.SOCIAL_WEBSITE_URL || "",
  }),
};

export const BRAND = {
  name: "Sprinter Customer Care",
  shortName: "Sprinter Care",
  tagline: "King of Online Gaming",
  subtitle: "Enter your 10-digit mobile to start chatting",
} as const;
