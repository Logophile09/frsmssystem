-- =====================================================================
-- FRSMS v2 :: Link personnel roster rows to login accounts
--
-- Run this ONCE in Supabase Studio -> SQL Editor if you already ran
-- schema.sql before this column existed. `profile_id` connects a
-- roster row in `personnel` to the matching login account in
-- `profiles`. It's set automatically by the backend when an
-- administrator approves a self-registered account in Staff Accounts
-- (see backend/src/routes/staffAccounts.ts) -- that's the "transition"
-- from a pending registration into a full personnel record.
--
-- Skip this file entirely if you're setting up a brand new database
-- with the current schema.sql -- it already includes this column.
-- =====================================================================

alter table personnel add column if not exists profile_id uuid unique references profiles(id) on delete set null;
