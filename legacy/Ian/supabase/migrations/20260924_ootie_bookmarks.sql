create extension if not exists "pgcrypto";

create table if not exists public.ootie_bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  product_url text not null,
  title text not null,
  image_url text,
  image_storage_path text,
  brand text,
  price text,
  currency text default 'TWD',
  variant_name text,
  color text,
  size text,
  source_domain text,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ootie_bookmarks_owner_created_at
  on public.ootie_bookmarks (owner_id, created_at desc);

alter table public.ootie_bookmarks enable row level security;

create policy "Users can view their own bookmarks"
on public.ootie_bookmarks for select
using (
  auth.uid() = (
    select user_id from public.ootie_profiles where id = owner_id
  )
  or auth.uid() = owner_id
);

create policy "Users can insert their own bookmarks"
on public.ootie_bookmarks for insert
with check (
  auth.uid() = (
    select user_id from public.ootie_profiles where id = owner_id
  )
  or auth.uid() = owner_id
);

create policy "Users can update their own bookmarks"
on public.ootie_bookmarks for update
using (
  auth.uid() = (
    select user_id from public.ootie_profiles where id = owner_id
  )
  or auth.uid() = owner_id
)
with check (
  auth.uid() = (
    select user_id from public.ootie_profiles where id = owner_id
  )
  or auth.uid() = owner_id
);

create policy "Users can delete their own bookmarks"
on public.ootie_bookmarks for delete
using (
  auth.uid() = (
    select user_id from public.ootie_profiles where id = owner_id
  )
  or auth.uid() = owner_id
);

create or replace function public.update_ootie_bookmarks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_ootie_bookmarks_updated_at
before update on public.ootie_bookmarks
for each row
execute function public.update_ootie_bookmarks_updated_at();

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'ootie_profiles'
  ) then
    alter table public.ootie_bookmarks
      add constraint ootie_bookmarks_owner_id_fkey
      foreign key (owner_id) references public.ootie_profiles(id) on delete cascade;
  end if;
end $$;
