-- Security hardening. Run after 0001 and 0002. Safe to re-run.
--
-- Model: the browser may only READ its own data. Every write (messages, conversations,
-- profiles) goes through the Next.js API routes, which validate input and use the
-- service-role key. Uploads and realtime are locked to the conversation's owner + admins.

-- ---------------------------------------------------------------------------
-- 1. No direct writes from the browser to app tables
-- ---------------------------------------------------------------------------
drop policy if exists "insert own user messages" on public.messages;
drop policy if exists "admin insert messages" on public.messages;
drop policy if exists "update read state" on public.messages;

drop policy if exists "insert own conv" on public.conversations;
drop policy if exists "update own or admin conv" on public.conversations;
drop policy if exists "admin update conv" on public.conversations;

drop policy if exists "update own or admin" on public.profiles;
drop policy if exists "admin update profiles" on public.profiles;

-- ---------------------------------------------------------------------------
-- 2. Storage: owner/admin-only uploads, no public listing, type + size limits
-- ---------------------------------------------------------------------------
-- Files stay reachable by their (unguessable) public URL, but nobody can list the bucket.
drop policy if exists "chat media read" on storage.objects;
create policy "chat media read" on storage.objects
  for select to authenticated using (
    bucket_id = 'chat-media' and (
      public.is_admin() or exists (
        select 1 from public.conversations c
        where c.user_id = auth.uid() and c.id::text = (storage.foldername(name))[1]
      )
    )
  );

drop policy if exists "chat media upload" on storage.objects;
create policy "chat media upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'chat-media' and (
      public.is_admin() or exists (
        select 1 from public.conversations c
        where c.user_id = auth.uid() and c.id::text = (storage.foldername(name))[1]
      )
    )
  );

update storage.buckets
set file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
      'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/x-m4a'
    ]
where id = 'chat-media';

-- ---------------------------------------------------------------------------
-- 3. Realtime: private channels (the app subscribes with { private: true })
--    calls:lobby, admin:conversations -> admins only
--    call:<conversationId>, conv:<conversationId> -> that customer + admins
-- ---------------------------------------------------------------------------
drop policy if exists "sprinter realtime read" on realtime.messages;
create policy "sprinter realtime read" on realtime.messages
  for select to authenticated using (
    case
      when realtime.topic() in ('calls:lobby', 'admin:conversations') then public.is_admin()
      when realtime.topic() like 'call:%' or realtime.topic() like 'conv:%' then
        public.is_admin() or exists (
          select 1 from public.conversations c
          where c.user_id = auth.uid()
            and realtime.topic() in ('call:' || c.id::text, 'conv:' || c.id::text)
        )
      else false
    end
  );

drop policy if exists "sprinter realtime write" on realtime.messages;
create policy "sprinter realtime write" on realtime.messages
  for insert to authenticated with check (
    realtime.topic() like 'call:%' and (
      public.is_admin() or exists (
        select 1 from public.conversations c
        where c.user_id = auth.uid() and realtime.topic() = 'call:' || c.id::text
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Rate limiting (fixed window), used by the API routes via the service role
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);
alter table public.rate_limits enable row level security; -- no policies: service role only

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  c int;
  expired boolean;
begin
  insert into rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                 then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                        then now() else r.window_start end
  returning count into c;

  -- Occasional cleanup so the table stays small.
  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '2 days';
  end if;

  return c <= p_max;
end;
$$;

revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
