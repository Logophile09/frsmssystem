-- =====================================================================
-- FRSMS v3 :: Add 6-Role System to user_role enum
--
-- Adds 'brgy_official', 'citizen', and 'non_citizen' roles to the
-- PostgreSQL user_role enum type in Supabase.
-- =====================================================================

alter type user_role add value if not exists 'brgy_official';
alter type user_role add value if not exists 'citizen';
alter type user_role add value if not exists 'non_citizen';

-- Optional verification query:
-- select enumlabel from pg_enum join pg_type on pg_enum.enumtypid = pg_type.oid where typname = 'user_role';
