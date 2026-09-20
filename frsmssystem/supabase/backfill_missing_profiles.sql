-- =====================================================================
-- FRSMS :: Backfill missing profiles for existing auth.users
--
-- Fixes accounts stuck with "No profile found for this account" --
-- this happens when someone signed in (e.g. via "Continue with
-- Google") *before* add_google_oauth_profile_trigger.sql was run, so
-- the on_auth_user_created trigger never fired for them and their
-- auth.users row has no matching profiles row.
--
-- Run this ONCE in Supabase Studio -> SQL Editor, AFTER you've run (in
-- this order):
--   1. add_pending_status_migration.sql   (only if profiles/account_status predates it)
--   2. add_avatar_url_migration.sql
--   3. add_google_oauth_profile_trigger.sql
--
-- This does the same insert the trigger does, just for every
-- already-existing auth.users row that's currently missing a profile,
-- so it's safe to re-run any time -- accounts that already have a
-- profile are skipped.
-- =====================================================================

insert into public.profiles (id, username, full_name, role, status, avatar_url)
select
  u.id,
  case
    when exists (
      select 1 from public.profiles p2
      where p2.username = lower(regexp_replace(split_part(u.email, '@', 1), '[^a-z0-9._-]', '', 'g'))
    )
    then lower(regexp_replace(split_part(u.email, '@', 1), '[^a-z0-9._-]', '', 'g')) || '-' || substr(u.id::text, 1, 4)
    else coalesce(nullif(lower(regexp_replace(split_part(u.email, '@', 1), '[^a-z0-9._-]', '', 'g')), ''), 'staff')
  end as username,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)) as full_name,
  'staff',
  'pending',
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
