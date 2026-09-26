-- Deploy this function in Supabase for the top-worn item leaderboard.
create or replace function public.get_top_worn_items()
returns table (
  id uuid,
  name text,
  name_zh text,
  photo text,
  wear_count integer
)
language sql
stable
security invoker
as $$
  select id, name, name_zh, photo, coalesce(wear_count, 0)::integer
  from public.ootie_clothing_items
  where owner_id = current_profile_id()
    and hidden = false
  order by coalesce(wear_count, 0) desc;
$$;