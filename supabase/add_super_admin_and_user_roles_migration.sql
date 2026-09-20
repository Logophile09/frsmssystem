-- =====================================================================
-- FRSMS v2 :: Add 'super_admin' and 'user' roles to user_role enum
--
-- Run this ONCE in Supabase Studio -> SQL Editor if you already ran
-- the original schema.sql (which only had ('admin', 'staff')).
--
-- This adds the 'super_admin', 'super admin', and 'user' roles to
-- allow 3-tier access:
--   1. Super Admin: full unrestricted system control and account management
--   2. Admin: operational administration and user management
--   3. User: standard responder / operational user access
--
-- Skip this file if setting up a fresh database with the updated schema.sql.
-- =====================================================================

alter type user_role add value if not exists 'super_admin';
alter type user_role add value if not exists 'super admin';
alter type user_role add value if not exists 'user';

-- Optional: to promote an existing admin or user to super_admin, run:
-- update profiles set role = 'super_admin' where username = 'admin';
