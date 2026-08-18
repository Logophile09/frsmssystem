-- =====================================================================
-- FRSMS :: Normalize incidents.severity to the 1-5 Alert Level scale
-- (robust version -- works whether the column is currently text or an
-- enum with word labels like 'low'/'critical')
--
-- Run this ONCE in Supabase Studio -> SQL Editor.
-- =====================================================================

-- Step 1: Convert the column to plain text first. This is a safe,
-- lossless cast whether it's already text (no-op) or an enum (every
-- Postgres enum can be cast to text). Doing this up front means the
-- rest of this script doesn't need to know or care what the column's
-- starting type was.
alter table incidents alter column severity type text using severity::text;

-- Step 2: Normalize every existing value to '1'-'5'. Rows already
-- holding a plain '1'-'5' pass through untouched.
update incidents set severity = '1' where lower(severity) in ('low', 'minor');
update incidents set severity = '3' where lower(severity) in ('moderate', 'medium');
update incidents set severity = '4' where lower(severity) in ('high');
update incidents set severity = '5' where lower(severity) in ('critical', 'severe');

-- Step 3: Surface anything that still isn't '1'-'5' instead of silently
-- leaving bad data or blocking the constraint below with a cryptic error.
do $$
declare
  bad_count integer;
begin
  select count(*) into bad_count from incidents where severity !~ '^[1-5]$';
  if bad_count > 0 then
    raise notice 'Heads up: % row(s) still have an unrecognized severity value. Run `select id, incident_number, severity from incidents where severity !~ ''^[1-5]$'';` to see and fix them by hand, then re-run this script.', bad_count;
  end if;
end $$;

-- Step 4: Lock the column down so it can only ever hold '1'-'5' from
-- now on -- guards against this drifting again from manual table-editor
-- entries. Only added once the data is actually clean.
do $$
begin
  if not exists (select 1 from incidents where severity !~ '^[1-5]$') then
    alter table incidents drop constraint if exists incidents_severity_check;
    alter table incidents add constraint incidents_severity_check check (severity in ('1', '2', '3', '4', '5'));
  end if;
end $$;

notify pgrst, 'reload schema';
