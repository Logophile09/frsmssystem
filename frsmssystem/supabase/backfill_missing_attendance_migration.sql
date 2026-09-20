-- ---------------------------------------------------------------------
-- One-time backfill: give every existing `personnel` row that has no
-- attendance record at all yet a baseline row for today, status
-- 'off_duty'. Run this once, after
-- add_atomic_personnel_onboarding_migration_1.sql (needs the 'off_duty'
-- enum value) and _2.sql.
--
-- Safe to re-run: the WHERE NOT EXISTS guard skips anyone who already
-- has at least one attendance row (including today's), and the
-- unique(personnel_id, attendance_date) constraint would reject a
-- duplicate for today even if the guard somehow missed someone.
-- ---------------------------------------------------------------------

insert into attendance (personnel_id, attendance_date, status, remarks)
select
  p.id,
  current_date,
  'off_duty',
  'Backfilled -- no prior attendance record'
from personnel p
where not exists (
  select 1 from attendance a where a.personnel_id = p.id
);
