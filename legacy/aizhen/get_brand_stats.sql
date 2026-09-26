-- Deploy this function in Supabase for the brand statistics chart.
create or replace function public.get_brand_stats()
returns table (
  brand text,
  item_count bigint,
  total_wear_count bigint
)
language sql
stable
security invoker
as $$
  with normalized_brands as (
    select
      lower(nullif(trim(brand), '')) as brand_key,
      nullif(trim(brand), '') as display_brand,
      coalesce(wear_count, 0)::bigint as wear_count
    from public.ootie_clothing_items
    where hidden = false
  )
  select
    coalesce(min(display_brand), '未分類') as brand,
    count(*)::bigint as item_count,
    sum(wear_count)::bigint as total_wear_count
  from normalized_brands
  group by brand_key
  order by item_count desc, total_wear_count desc
  limit 10;
$$;