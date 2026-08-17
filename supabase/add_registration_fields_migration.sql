-- =====================================================================
-- FRSMS v2 :: Add self-registration profile fields
--
-- Run this ONCE in Supabase Studio -> SQL Editor if you already ran
-- schema.sql before these columns existed. They're populated by the
-- public /api/register endpoint when someone submits the Staff
-- Registration form -- the account lands with status = 'pending'
-- until an administrator approves it in Staff Accounts.
--
-- Skip this file entirely if you're setting up a brand new database
-- with the current schema.sql -- it already includes these columns.
-- =====================================================================

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists position text;
alter table profiles add column if not exists station text;
alter table profiles add column if not exists notes text;
