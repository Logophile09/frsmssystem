-- =====================================================================
-- FRSMS v2 :: One-time backfill — link existing Staff Accounts to
-- Personnel roster rows
--
-- Why: `ensurePersonnelRecord` (backend/src/lib/personnelSync.ts) already
-- auto-creates a Personnel row whenever an admin approves a
-- self-registration or creates a staff account -- so this ONLY needs to
-- run once, to catch active staff accounts that existed before that
-- linkage was added and never got a Personnel row.
--
-- Rules (mirrors the backend logic exactly, so results match what the
-- app would have done automatically):
--   - role = 'staff' only (admins are login-only, not roster personnel)
--   - status = 'active' only (skips disabled accounts, e.g. an account
--     someone signed up twice for)
--   - skips any profile that already has a linked personnel row
--
-- Safe to re-run: profile_id is unique, so already-linked profiles are
-- excluded by the NOT EXISTS check and nothing is duplicated.
-- =====================================================================

with next_no as (
  select coalesce(max(substring(employee_no from 'EMP-(\d+)')::int), 1000) as start_no
  from personnel
),
missing as (
  select
    p.id,
    p.full_name,
    p.phone,
    p.position,
    u.email,
    row_number() over (order by p.created_at) as rn
  from profiles p
  join auth.users u on u.id = p.id
  where p.role = 'staff'
    and p.status = 'active'
    and not exists (select 1 from personnel per where per.profile_id = p.id)
)
insert into personnel (employee_no, full_name, rank_title, phone, email, status, hire_date, profile_id)
select
  'EMP-' || (next_no.start_no + missing.rn),
  missing.full_name,
  coalesce(missing.position, 'Staff'),
  missing.phone,
  missing.email,
  'off_duty',
  current_date,
  missing.id
from missing, next_no
order by missing.rn;

-- Sanity check: run this after to confirm every active staff account now
-- has a roster row.
-- select p.full_name, p.status, per.employee_no
-- from profiles p
-- left join personnel per on per.profile_id = p.id
-- where p.role = 'staff' and p.status = 'active';