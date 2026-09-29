create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  initials text,
  bio text not null default '',
  avatar_url text,
  hearts integer not null default 0 check (hearts >= 0),
  helped integer not null default 0 check (helped >= 0),
  likes integer not null default 0 check (likes >= 0),
  public_closet boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  name_zh text,
  brand text not null default '',
  category text not null default 'Tops',
  shape text not null default '',
  primary_color text not null default '',
  secondary_color text not null default '',
  color_hex text not null default '#000000',
  style text not null default '',
  season text not null default 'All year',
  photo text not null default '',
  price numeric(12, 2),
  wear_count integer not null default 0 check (wear_count >= 0),
  last_worn date,
  purchase_date date,
  favorite boolean not null default false,
  hidden boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ootie_ootd_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  image text not null default '',
  caption text not null default '',
  item_ids uuid[] not null default '{}',
  wearing text[] not null default '{}',
  hashtags text[] not null default '{}',
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ootie_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.ootie_ootd_posts(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, owner_id)
);

create table if not exists public.ootie_saved_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.ootie_ootd_posts(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, owner_id)
);

create table if not exists public.ootie_sos_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  closet_owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  details text not null default '',
  occasion text not null default '',
  weather text not null default '',
  when_label text not null default '',
  vibes text[] not null default '{}',
  closet_item_ids uuid[] not null default '{}',
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  picked_suggestion_id uuid,
  notes text not null default '',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.ootie_outfit_suggestions (
  id uuid primary key default gen_random_uuid(),
  sos_id uuid not null references public.ootie_sos_posts(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  item_ids uuid[] not null default '{}',
  message text not null default '',
  hearts integer not null default 0 check (hearts >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.ootie_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  meta jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists items_owner_created_at_idx on public.items (owner_id, created_at desc);
create index if not exists ootie_ootd_posts_created_at_idx on public.ootie_ootd_posts (created_at desc);
create index if not exists ootie_ootd_posts_owner_created_at_idx on public.ootie_ootd_posts (owner_id, created_at desc);
create index if not exists ootie_sos_posts_created_at_idx on public.ootie_sos_posts (created_at desc);
create index if not exists ootie_outfit_suggestions_sos_created_at_idx on public.ootie_outfit_suggestions (sos_id, created_at desc);
create index if not exists ootie_notifications_owner_created_at_idx on public.ootie_notifications (owner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at before update on public.items
for each row execute function public.set_updated_at();
drop trigger if exists ootie_ootd_posts_set_updated_at on public.ootie_ootd_posts;
create trigger ootie_ootd_posts_set_updated_at before update on public.ootie_ootd_posts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.ootie_ootd_posts enable row level security;
alter table public.ootie_post_likes enable row level security;
alter table public.ootie_saved_posts enable row level security;
alter table public.ootie_sos_posts enable row level security;
alter table public.ootie_outfit_suggestions enable row level security;
alter table public.ootie_notifications enable row level security;

grant select on public.profiles, public.items, public.ootie_ootd_posts,
  public.ootie_sos_posts, public.ootie_outfit_suggestions to anon;
grant select, insert, update, delete on public.profiles, public.items,
  public.ootie_ootd_posts, public.ootie_post_likes, public.ootie_saved_posts,
  public.ootie_sos_posts, public.ootie_outfit_suggestions,
  public.ootie_notifications to authenticated;

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles for select using (id = (select auth.uid()) or public_closet);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists items_select_visible on public.items;
create policy items_select_visible on public.items for select using (
  owner_id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = owner_id and p.public_closet and not public.items.hidden
  )
);
drop policy if exists items_insert_own on public.items;
create policy items_insert_own on public.items for insert with check (owner_id = (select auth.uid()));
drop policy if exists items_update_own on public.items;
create policy items_update_own on public.items for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists items_delete_own on public.items;
create policy items_delete_own on public.items for delete using (owner_id = (select auth.uid()));

drop policy if exists ootie_ootd_posts_select_public on public.ootie_ootd_posts;
create policy ootie_ootd_posts_select_public on public.ootie_ootd_posts for select using (true);
drop policy if exists ootie_ootd_posts_insert_own on public.ootie_ootd_posts;
create policy ootie_ootd_posts_insert_own on public.ootie_ootd_posts for insert with check (owner_id = (select auth.uid()));
drop policy if exists ootie_ootd_posts_update_own on public.ootie_ootd_posts;
create policy ootie_ootd_posts_update_own on public.ootie_ootd_posts for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists ootie_ootd_posts_delete_own on public.ootie_ootd_posts;
create policy ootie_ootd_posts_delete_own on public.ootie_ootd_posts for delete using (owner_id = (select auth.uid()));

drop policy if exists ootie_post_likes_select_own on public.ootie_post_likes;
create policy ootie_post_likes_select_own on public.ootie_post_likes for select using (owner_id = (select auth.uid()));
drop policy if exists ootie_post_likes_insert_own on public.ootie_post_likes;
create policy ootie_post_likes_insert_own on public.ootie_post_likes for insert with check (owner_id = (select auth.uid()));
drop policy if exists ootie_post_likes_delete_own on public.ootie_post_likes;
create policy ootie_post_likes_delete_own on public.ootie_post_likes for delete using (owner_id = (select auth.uid()));

drop policy if exists ootie_saved_posts_select_own on public.ootie_saved_posts;
create policy ootie_saved_posts_select_own on public.ootie_saved_posts for select using (owner_id = (select auth.uid()));
drop policy if exists ootie_saved_posts_insert_own on public.ootie_saved_posts;
create policy ootie_saved_posts_insert_own on public.ootie_saved_posts for insert with check (owner_id = (select auth.uid()));
drop policy if exists ootie_saved_posts_delete_own on public.ootie_saved_posts;
create policy ootie_saved_posts_delete_own on public.ootie_saved_posts for delete using (owner_id = (select auth.uid()));

drop policy if exists ootie_sos_posts_select_public on public.ootie_sos_posts;
create policy ootie_sos_posts_select_public on public.ootie_sos_posts for select using (true);
drop policy if exists ootie_sos_posts_insert_own on public.ootie_sos_posts;
create policy ootie_sos_posts_insert_own on public.ootie_sos_posts for insert with check (owner_id = (select auth.uid()) and closet_owner_id = (select auth.uid()));
drop policy if exists ootie_sos_posts_update_own on public.ootie_sos_posts;
create policy ootie_sos_posts_update_own on public.ootie_sos_posts for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists ootie_sos_posts_delete_own on public.ootie_sos_posts;
create policy ootie_sos_posts_delete_own on public.ootie_sos_posts for delete using (owner_id = (select auth.uid()));

drop policy if exists ootie_outfit_suggestions_select_public on public.ootie_outfit_suggestions;
create policy ootie_outfit_suggestions_select_public on public.ootie_outfit_suggestions for select using (true);
drop policy if exists ootie_outfit_suggestions_insert_own on public.ootie_outfit_suggestions;
create policy ootie_outfit_suggestions_insert_own on public.ootie_outfit_suggestions for insert with check (owner_id = (select auth.uid()));
drop policy if exists ootie_outfit_suggestions_update_own on public.ootie_outfit_suggestions;
create policy ootie_outfit_suggestions_update_own on public.ootie_outfit_suggestions for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists ootie_outfit_suggestions_delete_own on public.ootie_outfit_suggestions;
create policy ootie_outfit_suggestions_delete_own on public.ootie_outfit_suggestions for delete using (owner_id = (select auth.uid()));

drop policy if exists ootie_notifications_select_own on public.ootie_notifications;
create policy ootie_notifications_select_own on public.ootie_notifications for select using (owner_id = (select auth.uid()));
drop policy if exists ootie_notifications_insert_own on public.ootie_notifications;
create policy ootie_notifications_insert_own on public.ootie_notifications for insert with check (owner_id = (select auth.uid()));
drop policy if exists ootie_notifications_update_own on public.ootie_notifications;
create policy ootie_notifications_update_own on public.ootie_notifications for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists ootie_notifications_delete_own on public.ootie_notifications;
create policy ootie_notifications_delete_own on public.ootie_notifications for delete using (owner_id = (select auth.uid()));

create or replace function public.get_closet_stats()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'colorStats', coalesce((select jsonb_agg(jsonb_build_object('color', grouped.primary_color, 'color_hex', grouped.color_hex, 'count', grouped.item_count)) from (select primary_color, min(color_hex) as color_hex, count(*) as item_count from public.items where owner_id = (select auth.uid()) and not hidden group by primary_color) grouped), '[]'::jsonb),
    'colorFamilyStats', coalesce((select jsonb_agg(jsonb_build_object('secondary_color', grouped.secondary_color, 'count', grouped.item_count)) from (select secondary_color, count(*) as item_count from public.items where owner_id = (select auth.uid()) and not hidden group by secondary_color) grouped), '[]'::jsonb),
    'styleStats', coalesce((select jsonb_agg(jsonb_build_object('style', grouped.style, 'count', grouped.item_count)) from (select style, count(*) as item_count from public.items where owner_id = (select auth.uid()) and not hidden group by style) grouped), '[]'::jsonb),
    'categoryStats', coalesce((select jsonb_agg(jsonb_build_object('category', grouped.category, 'count', grouped.item_count)) from (select category, count(*) as item_count from public.items where owner_id = (select auth.uid()) and not hidden group by category) grouped), '[]'::jsonb)
  );
$$;

create or replace function public.get_brand_stats()
returns table (brand text, item_count bigint, total_wear_count bigint)
language sql stable security invoker set search_path = '' as $$
  select coalesce(nullif(trim(i.brand), ''), '未分類'), count(*), sum(i.wear_count)::bigint
  from public.items i where i.owner_id = (select auth.uid()) and not i.hidden
  group by coalesce(nullif(trim(i.brand), ''), '未分類') order by count(*) desc limit 10;
$$;

create or replace function public.get_top_worn_items()
returns table (id uuid, name text, name_zh text, photo text, wear_count integer)
language sql stable security invoker set search_path = '' as $$
  select i.id, i.name, i.name_zh, i.photo, i.wear_count from public.items i
  where i.owner_id = (select auth.uid()) and not i.hidden order by i.wear_count desc;
$$;

create or replace function public.get_cost_per_wear_ranking()
returns table (id uuid, name text, name_zh text, photo text, price numeric, wear_count integer, cost_per_wear numeric)
language sql stable security invoker set search_path = '' as $$
  select i.id, i.name, i.name_zh, i.photo, i.price, i.wear_count, round(i.price / i.wear_count, 0)
  from public.items i where i.owner_id = (select auth.uid()) and not i.hidden and i.price > 0 and i.wear_count > 0
  order by round(i.price / i.wear_count, 0);
$$;

create or replace function public.get_disused_items()
returns table (id uuid, name text, name_zh text, photo text, last_worn text, wear_count integer)
language sql stable security invoker set search_path = '' as $$
  select i.id, i.name, i.name_zh, i.photo, i.last_worn::text, i.wear_count from public.items i
  where i.owner_id = (select auth.uid()) and not i.hidden
    and ((i.last_worn is not null and i.last_worn < current_date - 90) or i.wear_count < 2 or (i.last_worn is null and i.wear_count = 0))
  order by i.last_worn asc nulls first, i.wear_count asc;
$$;

grant execute on function public.get_closet_stats() to authenticated;
grant execute on function public.get_brand_stats() to authenticated;
grant execute on function public.get_top_worn_items() to authenticated;
grant execute on function public.get_cost_per_wear_ranking() to authenticated;
grant execute on function public.get_disused_items() to authenticated;