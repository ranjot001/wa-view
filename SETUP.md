# Reddy Customers Care — setup

WhatsApp-styled customer-care app (the client's own **Sprinters** branding — not a
WhatsApp clone). Customer enters their mobile number → chat with an AI bot
(Claude) that hands off to a human admin.

Stack: Next.js 15 (App Router) · Supabase (Postgres/Auth/Realtime/Storage) ·
Anthropic (Claude) · Tailwind v4.

## 1. Install
```bash
npm install
cp .env.example .env.local   # already created; fill in values
```

## 2. Supabase
1. Create a project at supabase.com.
2. Run the schema: open **SQL Editor** and paste `supabase/migrations/0001_init.sql`
   (or `supabase db push` with the CLI). This creates tables, RLS, realtime, and the
   `chat-media` storage bucket.
3. Copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API, keep secret)
4. Then run `0002_lock_down_updates.sql` and `0003_security_hardening.sql`, in that
   order. **0003 is required**: the app uses private realtime channels, so live chat
   and calls won't work until its policies exist.

### Supabase dashboard security switches (do once)
- Authentication → Sign In / Providers → **turn off "Allow new users to sign up"**
  (the server still creates customer accounts with the service key).
- Authentication → Sign In / Providers → **turn off Anonymous sign-ins** and the
  **Phone** provider (no longer used).
- Authentication → Hooks → **disable the old "Send SMS" hook** if it was set up.
- Realtime → Settings → **turn off "Allow public access"** (only private channels).
- Give every admin a long, unique password.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` only in server env vars
  (never `NEXT_PUBLIC_*`); set a monthly spend limit in the Anthropic console.

## 3. Claude
- Set `ANTHROPIC_API_KEY`. `ANTHROPIC_MODEL` defaults to `claude-sonnet-5-5`.
- Tune the bot persona in `src/lib/ai/systemPrompt.ts`.

## 4. Admin accounts
Customers sign in with just their number, which is **not verified**, so admins use
email + password instead (number-only login refuses admin accounts).

For each agent: Supabase → Authentication → Users → **Add user** → email + password
(tick "Auto confirm"). Then in the SQL editor:
```sql
update public.profiles set is_admin = true, display_name = 'Agent name'
where id = (select id from auth.users where email = 'agent@example.com');
```
They sign in at `/admin`. To remove an agent, set `is_admin = false` or delete the user.

## 5. Run
```bash
npm run dev     # http://localhost:3000
```

## Routes
- `/verify` — Part 1: mobile number (no OTP)
- `/install` — Part 2: install to home screen (native prompt on Android/desktop Chrome;
  loading screen + "Add to Home Screen" guide on iPhone). Skipped when opened from the
  home screen.
- `/chat` — Part 3: chat + voice call (top-left arrow → `/links`)
- `/links` — Part 4: social links (`SOCIAL_*_URL` env vars; blank entries are hidden)
- `/admin` — admin email/password login + inbox (search, Mine/status filters); `/admin/conversations/[id]` — live thread

## Notes
- **Voice calls** are browser-to-browser WebRTC, signalled over Supabase Realtime
  broadcast (`src/lib/call/session.ts`). The customer taps **Call**; every admin with
  `/admin/conversations` open gets the incoming-call screen (first to accept wins).
  Needs HTTPS + mic permission. STUN only by default — add a TURN server
  (`NEXT_PUBLIC_TURN_*`) for reliable calls on mobile data / strict NATs.
- **Security model:** the browser can only *read* its own data. All writes go through
  `/api/*`, which validate input, rate-limit (login 10/10 min per IP, chat 12/min and
  300/day per customer), and reject cross-site requests. Uploads are limited to
  images/audio ≤ 10 MB in the customer's own folder.
- Customer numbers are **not verified** — anyone typing a number sees that number's
  chat. Agents should not share account details based on the number alone.
- `npm audit` is clean (postcss pinned via `overrides` in package.json).
