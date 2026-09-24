-- Deploy this function in Supabase. It keeps the three chart aggregations in the database.
create or replace function public.get_closet_stats()
returns jsonb
language sql
stable
security invoker
as $$
  with visible_items as (
    select primary_color, secondary_color, style, category, color_hex
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
  color_family_stats as (
    select jsonb_agg(jsonb_build_object('secondary_color', color_family, 'count', item_count) order by item_count desc) as value
    from (
      select case
        when lower(trim(secondary_color)) in ('無彩色系', '白色', '黑色', '炭灰色', '米白色', '白色系', '黑色系', '灰色系') then '無彩色系'
        when lower(trim(secondary_color)) in ('大地色系', '卡其色', '奶茶色', '棕色', '米色', '棕色系', '米色系') then '大地色系'
        when lower(trim(secondary_color)) in ('清甜暖色系', '暖橙色', '奶油黃', '櫻花粉', '芥末黃') then '清甜暖色系'
        when lower(trim(secondary_color)) in ('藍綠冷色系', '丹寧藍', '天藍色', '軍綠色', '酪梨綠', '藍色系') then '藍綠冷色系'
        when lower(trim(secondary_color)) in ('紫紅神秘系', '酒紅色', '薰衣草紫', '玫瑰紅', '葡萄紫') then '紫紅神秘系'
        else null
      end as color_family, count(*) as item_count
      from visible_items
      where nullif(secondary_color, '') is not null
      group by color_family
      having color_family is not null
    ) grouped_color_families
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
    'colorFamilyStats', coalesce((select value from color_family_stats), '[]'::jsonb),
    'styleStats', coalesce((select value from style_stats), '[]'::jsonb),
    'categoryStats', coalesce((select value from category_stats), '[]'::jsonb)
  );
$$;