-- OOTIE development schema
-- Run this in Supabase SQL Editor.
-- The policies below intentionally allow public read/write for development only.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid()
);

alter table public.profiles
  add column if not exists avatar_url text;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image text not null,
  caption text not null default '',
  item_ids text[] not null default '{}',
  wearing text[] not null default '{}',
  hashtags text[] not null default '{}',
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  created_at timestamptz not null default now()
);

insert into public.profiles (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

drop policy if exists "dev profiles select" on public.profiles;
create policy "dev profiles select"
on public.profiles for select using (true);

drop policy if exists "dev profiles insert" on public.profiles;
create policy "dev profiles insert"
on public.profiles for insert with check (true);

drop policy if exists "dev profiles update" on public.profiles;
create policy "dev profiles update"
on public.profiles for update using (true) with check (true);

drop policy if exists "dev posts select" on public.posts;
create policy "dev posts select"
on public.posts for select using (true);

drop policy if exists "dev posts insert" on public.posts;
create policy "dev posts insert"
on public.posts for insert with check (true);

drop policy if exists "dev posts update" on public.posts;
create policy "dev posts update"
on public.posts for update using (true) with check (true);

drop policy if exists "dev posts delete" on public.posts;
create policy "dev posts delete"
on public.posts for delete using (true);

-- The active OOTD table is public.ootie_ootd_posts.
alter table public.ootie_ootd_posts enable row level security;

drop policy if exists "dev ootie ootd update" on public.ootie_ootd_posts;
create policy "dev ootie ootd update"
on public.ootie_ootd_posts for update using (true) with check (true);

drop policy if exists "dev ootie ootd delete" on public.ootie_ootd_posts;
create policy "dev ootie ootd delete"
on public.ootie_ootd_posts for delete using (true);

-- These policies are temporary development settings.
-- Replace them with auth.uid() checks before production use.
