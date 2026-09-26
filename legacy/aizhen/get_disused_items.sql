create or replace function public.get_disused_items()
returns table (
  id uuid,
  name text,
  name_zh text,
  photo text,
  last_worn text, -- 👈 修正：改為 text 以符合資料表欄位型別
  wear_count integer
)
language sql
stable
security invoker
as $$
  select id, name, name_zh, photo, last_worn, wear_count
  from public.ootie_clothing_items
  where owner_id = auth.uid()
    and hidden = false
    and (
      -- 轉型為 date 進行 90 天前的運算
      (nullif(last_worn, '') is not null and last_worn::date < current_date - 30)
      or wear_count < 2
      or (nullif(last_worn, '') is null and coalesce(wear_count, 0) = 0)
    )
  order by last_worn is not null, last_worn asc nulls first, wear_count asc;
$$;