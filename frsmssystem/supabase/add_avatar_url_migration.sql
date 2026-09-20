-- =====================================================================
-- FRSMS :: Add avatar_url to profiles
--
-- Run this ONCE in Supabase Studio -> SQL Editor if you already ran the
-- original schema.sql (which didn't have this column). Stores the
-- person's Google account photo (picture/avatar_url from the OAuth
-- profile) so it can be shown instead of the plain initials chip.
-- Email/password accounts simply leave this null and keep the initials
-- fallback.
--
-- Skip this file entirely if you're setting up a brand new database
-- with the current schema.sql -- it already includes this column.
-- =====================================================================

alter table profiles add column if not exists avatar_url text;
