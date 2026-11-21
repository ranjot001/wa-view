-- Customers sign in with an unverified phone number, so the browser must not be able to
-- change privileged columns. Previously "update own" let any user set profiles.is_admin
-- (or conversations.status / assigned_admin) on their own row via the anon key.
-- All legitimate writes to these tables go through the server's service-role client.

drop policy if exists "update own or admin" on public.profiles;
create policy "admin update profiles" on public.profiles
  for update using (public.is_admin());

drop policy if exists "update own or admin conv" on public.conversations;
create policy "admin update conv" on public.conversations
  for update using (public.is_admin());

-- Customers may only create their own conversation in the default 'bot' state.
drop policy if exists "insert own conv" on public.conversations;
create policy "insert own conv" on public.conversations
  for insert with check (user_id = auth.uid() and status = 'bot' and assigned_admin is null);
