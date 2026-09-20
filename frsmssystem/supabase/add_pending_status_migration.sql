-- =====================================================================
-- FRSMS v2 :: Add 'pending' account status
--
-- Run this ONCE in Supabase Studio -> SQL Editor if you already ran
-- the original schema.sql (which only had 'active'/'disabled'). This
-- adds a third status used for accounts that self-register via Google
-- or Facebook sign-in -- they're auto-created but held as 'pending'
-- until an administrator approves them in Staff Accounts, so social
-- login can't be used to self-provision access to the system.
--
-- Skip this file entirely if you're setting up a brand new database
-- with the current schema.sql -- it already includes 'pending'.
-- =====================================================================

alter type account_status add value if not exists 'pending';
