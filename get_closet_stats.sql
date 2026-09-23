-- Deploy this function in Supabase. It keeps the three chart aggregations in the database.
create or replace function public.get_closet_stats()
returns jsonb
language sql
stable
security invoker
as $$
  with visible_items as (
    select primary_color, style, category, color_hex
    from public.ootie_clothing_items
    where owner_id = current_profile_id()
      and hidden = false
  ),
  color_stats as (
    select jsonb_agg(jsonb_build_object('color', primary_color, 'color_hex', color_hex, 'count', item_count) order by item_count desc) as value
    from (
      select primary_color, min(coalesce(color_hex, '#D8D2C8')) as color_hex, count(*) as item_count
      from visible_items
      where nullif(primary_color, '') is not null
      group by primary_color
    ) grouped_colors
  ),
  style_stats as (
    select jsonb_agg(jsonb_build_object('style', style, 'count', item_count) order by item_count desc) as value
    from (
      select style, count(*) as item_count
      from visible_items
      where nullif(style, '') is not null
      group by style
    ) grouped_styles
  ),
  category_stats as (
    select jsonb_agg(jsonb_build_object('category', category, 'count', item_count) order by item_count desc) as value
    from (
      select category, count(*) as item_count
      from visible_items
      where nullif(category, '') is not null
      group by category
    ) grouped_categories
  )
  select jsonb_build_object(
    'colorStats', coalesce((select value from color_stats), '[]'::jsonb),
    'styleStats', coalesce((select value from style_stats), '[]'::jsonb),
    'categoryStats', coalesce((select value from category_stats), '[]'::jsonb)
  );
$$;