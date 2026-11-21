-- Admin-editable branding + welcome message. Single row (id = 1). Safe to re-run.
-- Readable by anyone (it's shown on public pages); written only by the server
-- (service role) after an admin check in /api/admin/settings.

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  book_name text not null default 'SPRINTER BOOK',
  support_name text not null default 'SPRINTER PANEL HUB',
  welcome_message text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;
drop policy if exists "settings readable" on public.app_settings;
create policy "settings readable" on public.app_settings for select using (true);
