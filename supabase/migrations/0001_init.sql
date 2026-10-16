-- Sprinter Customer Care — schema, RLS, realtime, storage.
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type conversation_status as enum ('bot', 'pending_human', 'human', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sender_type as enum ('user', 'bot', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_type as enum ('image', 'audio', 'file');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status conversation_status not null default 'bot',
  assigned_admin uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type sender_type not null,
  sender_id uuid references public.profiles(id) on delete set null,
  body text,
  media_url text,
  media_type media_type,
  reply_to uuid references public.messages(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_has_content check (body is not null or media_url is not null)
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);
create index if not exists idx_conversations_status on public.conversations(status, last_message_at desc);

-- ---------------------------------------------------------------------------
-- Helper: is the current user an admin? SECURITY DEFINER avoids RLS recursion.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- New auth user -> profile row (phone copied from auth.users)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep conversations.last_message_at fresh.
create or replace function public.bump_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.bump_conversation();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- profiles
drop policy if exists "read own or admin" on public.profiles;
create policy "read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "update own or admin" on public.profiles;
create policy "update own or admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- conversations
drop policy if exists "read own or admin conv" on public.conversations;
create policy "read own or admin conv" on public.conversations
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "insert own conv" on public.conversations;
create policy "insert own conv" on public.conversations
  for insert with check (user_id = auth.uid());

drop policy if exists "update own or admin conv" on public.conversations;
create policy "update own or admin conv" on public.conversations
  for update using (user_id = auth.uid() or public.is_admin());

-- messages
drop policy if exists "read conv messages" on public.messages;
create policy "read conv messages" on public.messages
  for select using (
    public.is_admin() or exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- Users may only insert their own 'user' messages into their own conversation.
drop policy if exists "insert own user messages" on public.messages;
create policy "insert own user messages" on public.messages
  for insert with check (
    sender_type = 'user'
    and sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Admins may insert admin messages anywhere.
drop policy if exists "admin insert messages" on public.messages;
create policy "admin insert messages" on public.messages
  for insert with check (public.is_admin() and sender_type = 'admin');

-- Mark-as-read updates.
drop policy if exists "update read state" on public.messages;
create policy "update read state" on public.messages
  for update using (
    public.is_admin() or exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter table public.messages replica identity full;
alter table public.conversations replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for chat media (voice notes, images, files)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

drop policy if exists "chat media read" on storage.objects;
create policy "chat media read" on storage.objects
  for select using (bucket_id = 'chat-media');

drop policy if exists "chat media upload" on storage.objects;
create policy "chat media upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'chat-media');
