create table if not exists public.ootie_item_hearts (
  item_id uuid not null references public.items(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (item_id, actor_id)
);

create index if not exists ootie_item_hearts_owner_idx
  on public.ootie_item_hearts (owner_id);

alter table public.ootie_item_hearts enable row level security;
revoke all on public.ootie_item_hearts from anon, authenticated;

create or replace function public.sync_profile_item_hearts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
    set hearts = hearts + 1
    where id = new.owner_id;
    return new;
  end if;

  update public.profiles
  set hearts = greatest(hearts - 1, 0)
  where id = old.owner_id;
  return old;
end;
$$;

drop trigger if exists ootie_item_hearts_sync_profile on public.ootie_item_hearts;
create trigger ootie_item_hearts_sync_profile
after insert or delete on public.ootie_item_hearts
for each row execute function public.sync_profile_item_hearts();

update public.profiles p
set hearts = coalesce((
  select count(*)::integer
  from public.ootie_item_hearts h
  where h.owner_id = p.id
), 0);

create or replace function public.get_ootie_item_heart_stats(
  p_item_ids uuid[],
  p_actor_id uuid
)
returns table (item_id uuid, heart_count bigint, liked_by_viewer boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id,
         count(h.actor_id)::bigint,
         coalesce(bool_or(h.actor_id = coalesce(auth.uid(), p_actor_id)), false)
  from public.items i
  join public.profiles p on p.id = i.owner_id
  left join public.ootie_item_hearts h on h.item_id = i.id
  where i.id = any(coalesce(p_item_ids, '{}'::uuid[]))
    and not i.hidden
    and (p.id = (select auth.uid()) or p.public_closet)
  group by i.id;
$$;

create or replace function public.toggle_ootie_item_heart(
  p_item_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_public boolean;
  v_actor_id uuid := coalesce(auth.uid(), p_actor_id);
  v_liked boolean;
  v_heart_count bigint;
begin
  if v_actor_id is null then
    raise exception 'A visitor identity is required';
  end if;

  select i.owner_id, p.public_closet
  into v_owner_id, v_public
  from public.items i
  join public.profiles p on p.id = i.owner_id
  where i.id = p_item_id and not i.hidden
  for update of i;

  if v_owner_id is null or not v_public then
    raise exception 'Hearts are only available for visible items in a public closet';
  end if;

  delete from public.ootie_item_hearts
  where item_id = p_item_id and actor_id = v_actor_id;

  if found then
    v_liked := false;
  else
    insert into public.ootie_item_hearts (item_id, owner_id, actor_id)
    values (p_item_id, v_owner_id, v_actor_id)
    on conflict (item_id, actor_id) do nothing;
    v_liked := exists (
      select 1 from public.ootie_item_hearts
      where item_id = p_item_id and actor_id = v_actor_id
    );
  end if;

  select count(*)::bigint into v_heart_count
  from public.ootie_item_hearts
  where item_id = p_item_id;

  return jsonb_build_object('liked', v_liked, 'heart_count', v_heart_count);
end;
$$;

revoke all on function public.get_ootie_item_heart_stats(uuid[], uuid) from public;
revoke all on function public.toggle_ootie_item_heart(uuid, uuid) from public;
grant execute on function public.get_ootie_item_heart_stats(uuid[], uuid) to anon, authenticated;
grant execute on function public.toggle_ootie_item_heart(uuid, uuid) to anon, authenticated;