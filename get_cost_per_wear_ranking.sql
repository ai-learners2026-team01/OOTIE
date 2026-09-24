-- Deploy this function in Supabase for the cost-per-wear leaderboard.
create or replace function public.get_cost_per_wear_ranking()
returns table (
  id uuid,
  name text,
  name_zh text,
  photo text,
  price numeric,
  wear_count integer,
  cost_per_wear numeric
)
language sql
stable
security invoker
as $$
  select
    id,
    name,
    name_zh,
    photo,
    price,
    coalesce(wear_count, 0)::integer as wear_count,
    round((price / wear_count)::numeric, 0) as cost_per_wear
  from public.ootie_clothing_items
  where owner_id = current_profile_id()
    and hidden = false
    and price is not null
    and price > 0
    and wear_count > 0
  order by cost_per_wear asc;
$$;