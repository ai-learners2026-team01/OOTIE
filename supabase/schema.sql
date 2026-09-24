create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique,
  email text,
  full_name text,
  username text,
  initials text,
  bio text,
  avatar_url text,
  hearts integer default 0,
  helped integer default 0,
  likes integer default 0,
  public_closet boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  name text not null,
  name_zh text,
  brand text,
  category text default 'Tops',
  shape text,
  primary_color text,
  secondary_color text,
  color_hex text,
  style text,
  season text,
  photo text,
  wear_count integer default 0,
  last_worn date,
  purchase_date date,
  favorite boolean default false,
  hidden boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.items enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = user_id);

create policy "items_select_own"
on public.items
for select
using (auth.uid() = user_id);

create policy "items_insert_own"
on public.items
for insert
with check (auth.uid() = user_id);

create policy "items_update_own"
on public.items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "items_delete_own"
on public.items
for delete
using (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

create trigger items_updated_at
before update on public.items
for each row execute function public.handle_updated_at();
