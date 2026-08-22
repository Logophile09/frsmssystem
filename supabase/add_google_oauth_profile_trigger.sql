-- =====================================================================
-- FRSMS :: Auto-create a `profiles` row for Google OAuth sign-ins
--
-- /api/register (email/password) always creates a matching `profiles`
-- row. But Login.tsx's "Continue with Google" button calls
-- supabase.auth.signInWithOAuth() directly -- Supabase Auth creates
-- the auth.users row itself, with no server-side step in between, so
-- no profiles row is ever created for that path. Every Google sign-in
-- then fails requireAuth() with "No profile found for this account".
--
-- This trigger fires whenever Supabase Auth inserts a new row into
-- auth.users. If a matching profiles row doesn't already exist (i.e.
-- this wasn't created via /api/register a moment earlier), it creates
-- one with status = 'pending' -- same as self-registration -- so the
-- new account still needs an administrator to flip it to 'active' in
-- Staff Accounts before it can use any protected route. It just makes
-- sure the account *lands* somewhere instead of dead-ending on a 403.
--
-- Run this ONCE in Supabase Studio -> SQL Editor.
-- =====================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  display_name text;
  photo_url text;
begin
  -- Skip if a profile already exists for this id (e.g. /api/register
  -- inserted it moments ago as part of the same signup).
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9._-]', '', 'g'));
  if base_username is null or base_username = '' then
    base_username := 'staff';
  end if;

  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    base_username
  );

  -- Google's OAuth profile puts the photo under 'avatar_url' or
  -- 'picture' depending on how Supabase mapped the provider response --
  -- check both.
  photo_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  final_username := base_username;
  if exists (select 1 from public.profiles where username = final_username) then
    final_username := base_username || '-' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, full_name, role, status, avatar_url)
  values (new.id, final_username, display_name, 'staff', 'pending', photo_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
