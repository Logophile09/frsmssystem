-- ---------------------------------------------------------------------
-- Atomic personnel onboarding -- part 1 of 2
-- ---------------------------------------------------------------------
-- Adds 'off_duty' to attendance_status so a freshly-onboarded person's
-- first attendance row can reflect "not clocked in yet" rather than
-- being forced into 'present' or 'absent', which are both wrong for
-- someone who was just added to the roster and hasn't shown up yet.
--
-- IMPORTANT: run this file as its own migration/transaction, committed
-- BEFORE part 2. Postgres won't let a new enum value be *used* in the
-- same transaction that ADD VALUE ran in (a value added in an open
-- transaction isn't visible to other statements until it commits), and
-- part 2's function body references 'off_duty' directly.
-- ---------------------------------------------------------------------

alter type attendance_status add value if not exists 'off_duty';
