-- Link legacy OOTie profiles to Supabase Auth users without touching public.profiles.
create or replace function public.create_ootie_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  if to_regclass('public.ootie_profiles') is null then
    return new;
  end if;

  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'OOTie User'
  );

  execute $insert_profile$
    insert into public.ootie_profiles (
      id, user_id, name, username, initials, avatar_url,
      bio, hearts, helped, likes, public_closet, created_at
    )
    values (
      gen_random_uuid(), $1, $2,
      '@user-' || right(replace($1::text, '-', ''), 12),
      upper(left($2, 2)), nullif($3, ''),
      '', 0, 0, 0, false, now()
    )
    on conflict (user_id) do nothing
  $insert_profile$
  using new.id, profile_name, new.raw_user_meta_data ->> 'avatar_url';

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.ootie_profiles') is null then
    raise notice 'Skipping Ootie Auth profile link: public.ootie_profiles does not exist.';
    return;
  end if;

  if exists (
    select user_id
    from public.ootie_profiles
    where user_id is not null
    group by user_id
    having count(*) > 1
  ) then
    raise exception 'Cannot link Auth users: public.ootie_profiles contains duplicate user_id values.';
  end if;

  create unique index if not exists ootie_profiles_user_id_uidx
    on public.ootie_profiles (user_id);

  drop trigger if exists on_auth_user_created_ootie_profile on auth.users;
  create trigger on_auth_user_created_ootie_profile
    after insert on auth.users
    for each row execute function public.create_ootie_profile_for_auth_user();

  insert into public.ootie_profiles (
    id, user_id, name, username, initials, avatar_url,
    bio, hearts, helped, likes, public_closet, created_at
  )
  select
    gen_random_uuid(), auth_user.id,
    coalesce(
      nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''),
      'OOTie User'
    ),
    '@user-' || right(replace(auth_user.id::text, '-', ''), 12),
    upper(left(coalesce(
      nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''),
      'OOTie User'
    ), 2)),
    nullif(auth_user.raw_user_meta_data ->> 'avatar_url', ''),
    '', 0, 0, 0, false, now()
  from auth.users as auth_user
  where not exists (
    select 1
    from public.ootie_profiles as profile
    where profile.user_id = auth_user.id
  )
  on conflict (user_id) do nothing;
end;
$$;