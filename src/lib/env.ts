// Centralised, lazily-read environment access so the app can be imported during
// `next build` without throwing when secrets are absent. Call the getters at
// request time, never at module top-level.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const env = {
  // Public (safe in the browser)
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  defaultCountryCode: () => process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "+91",

  // Server-only
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  authHookSecret: () => required("SUPABASE_AUTH_HOOK_SECRET"),
  otpProvider: () => (process.env.OTP_PROVIDER || "mock").toLowerCase(),
  anthropicApiKey: () => required("ANTHROPIC_API_KEY"),
  anthropicModel: () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
};

export const BRAND = {
  name: "Sprinter Customer Care",
  shortName: "Sprinter Care",
  tagline: "King of Online Gaming",
  subtitle: "Enter your 10-digit mobile to start chatting",
} as const;
