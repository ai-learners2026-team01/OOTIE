-- Migration: 20261002_ootie_profiles_ondemand.sql
-- Description: Supersedes 20261001_ootie_profiles_auth_link.sql.
-- Enforces atomic, rerunnable execution, explicit policy cleanup (including legacy "Enable read access for all users"),
-- precise privilege revocation/granting, column-level security on profiles, and profile-ID ownership for bookmarks.

BEGIN;

-- 1. Adjust existing columns and enforce user_id uniqueness on ootie_profiles
-- Remove random default from user_id if present
alter table public.ootie_profiles alter column user_id drop default;
create unique index if not exists ootie_profiles_user_id_idx on public.ootie_profiles (user_id);

-- Note on Auth foreign key: A validated foreign key referencing auth.users(id) cannot be added
-- immediately because 3 legacy profiles exist without matching auth.users records.
-- Foreign key constraint enforcement is deferred pending future legacy profile cleanup.

-- 2. Remove legacy global auth trigger and function if present
drop trigger if exists on_auth_user_created_ootie_profile on auth.users;
drop function if exists public.create_ootie_profile_for_auth_user();

-- 3. Revoke broad/inappropriate privileges and grant strict least-privilege permissions
revoke all on public.ootie_profiles from public, anon, authenticated;
revoke all on public.ootie_bookmarks from public, anon, authenticated;

grant select on public.ootie_profiles to anon, authenticated;
grant insert, update on public.ootie_profiles to authenticated;

-- Protect profile id, user_id, reputation counters, and timestamps against updates via column privileges
revoke update on public.ootie_profiles from authenticated;
grant update (name, username, initials, bio, avatar_url, public_closet) on public.ootie_profiles to authenticated;

grant select, insert, update, delete on public.ootie_bookmarks to authenticated;

-- 4. Enable RLS and clean up all legacy profile policies
alter table public.ootie_profiles enable row level security;
alter table public.ootie_bookmarks enable row level security;

-- Drop legacy profile policies including "Enable read access for all users"
drop policy if exists "Enable read access for all users" on public.ootie_profiles;
drop policy if exists "Profiles are publicly viewable when public_closet is true or own profile" on public.ootie_profiles;
drop policy if exists "Users can insert their own profile on demand" on public.ootie_profiles;
drop policy if exists "Users can update their own profile" on public.ootie_profiles;

-- Create strict profile policies with explicit roles
create policy "Profiles are publicly viewable when public_closet is true or own profile"
on public.ootie_profiles for select
to anon, authenticated
using (public_closet = true or auth.uid() = user_id);

create policy "Users can insert their own profile on demand"
on public.ootie_profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.ootie_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 5. Drop all eight exact legacy bookmark policies across both naming families
drop policy if exists "Users can view own bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can insert own bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can update own bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can delete own bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can view their own bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can insert their own bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can update their own bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can delete their own bookmarks" on public.ootie_bookmarks;

-- Clean up any extra legacy naming variants if present
drop policy if exists "Users can view their own ootie_bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can insert their own ootie_bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can update their own ootie_bookmarks" on public.ootie_bookmarks;
drop policy if exists "Users can delete their own ootie_bookmarks" on public.ootie_bookmarks;

-- 6. Create one explicit TO authenticated policy per CRUD operation using profile-ID ownership
create policy "Users can view their own bookmarks"
on public.ootie_bookmarks for select
to authenticated
using (owner_id in (select id from public.ootie_profiles where user_id = auth.uid()));

create policy "Users can insert their own bookmarks"
on public.ootie_bookmarks for insert
to authenticated
with check (owner_id in (select id from public.ootie_profiles where user_id = auth.uid()));

create policy "Users can update their own bookmarks"
on public.ootie_bookmarks for update
to authenticated
using (owner_id in (select id from public.ootie_profiles where user_id = auth.uid()))
with check (owner_id in (select id from public.ootie_profiles where user_id = auth.uid()));

create policy "Users can delete their own bookmarks"
on public.ootie_bookmarks for delete
to authenticated
using (owner_id in (select id from public.ootie_profiles where user_id = auth.uid()));

COMMIT;
