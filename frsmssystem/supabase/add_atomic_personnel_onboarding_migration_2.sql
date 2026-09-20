-- ---------------------------------------------------------------------
-- Atomic personnel onboarding -- part 2 of 2
-- ---------------------------------------------------------------------
-- create_personnel_with_attendance() inserts one row into `personnel`
-- and one row into `attendance` as a single unit of work. Both tables
-- are already related by the existing FK:
--
--   attendance.personnel_id -> personnel.id  (on delete cascade)
--   unique (attendance.personnel_id, attendance.attendance_date)
--
-- Atomicity comes from ordinary Postgres function semantics, not from
-- anything Supabase-specific: a PL/pgSQL function body runs inside the
-- transaction of whatever statement called it (here, the single RPC
-- call the backend makes). If the second insert fails after the first
-- succeeded, the uncaught exception aborts that transaction and
-- Postgres rolls back *everything* the function did -- there is no
-- code path that can leave a personnel row without its attendance row,
-- or vice versa.
--
-- The EXCEPTION block below doesn't weaken that guarantee -- PL/pgSQL
-- gives an EXCEPTION block its own implicit savepoint, so even the
-- "handled" unique_violation case rolls back both inserts before we
-- re-raise a friendlier error for the API layer to translate into a
-- 409.
-- ---------------------------------------------------------------------

create or replace function public.create_personnel_with_attendance(
  p_employee_no        text,
  p_full_name          text,
  p_rank_title         text,
  p_hire_date          date,
  p_phone              text default null,
  p_email              text default null,
  p_profile_id         uuid default null,
  p_attendance_date    date default current_date,
  p_attendance_remarks text default 'Auto-created on onboarding'
)
returns jsonb
language plpgsql
as $$
declare
  v_personnel   personnel%rowtype;
  v_attendance  attendance%rowtype;
begin
  if p_employee_no is null or btrim(p_employee_no) = '' then
    raise exception 'employee_no is required' using errcode = '22004';
  end if;
  if p_full_name is null or btrim(p_full_name) = '' then
    raise exception 'full_name is required' using errcode = '22004';
  end if;

  -- 1) Personnel Roster entry. New hires always land 'off_duty' --
  --    nobody is on duty before their first attendance record exists.
  insert into personnel (
    employee_no, full_name, rank_title, phone, email, status, hire_date, profile_id
  ) values (
    btrim(p_employee_no), btrim(p_full_name), p_rank_title, p_phone, p_email,
    'off_duty', p_hire_date, p_profile_id
  )
  returning * into v_personnel;

  -- 2) First Attendance entry, defaulted to 'off_duty' and tied to the
  --    personnel row just created via personnel_id. If this insert
  --    fails (e.g. a duplicate (personnel_id, attendance_date) from a
  --    retried request), step 1's insert is rolled back too.
  insert into attendance (
    personnel_id, attendance_date, status, remarks
  ) values (
    v_personnel.id, p_attendance_date, 'off_duty', p_attendance_remarks
  )
  returning * into v_attendance;

  return jsonb_build_object(
    'personnel', to_jsonb(v_personnel),
    'attendance', to_jsonb(v_attendance)
  );

exception
  when unique_violation then
    -- Covers a duplicate employee_no, a profile_id already linked to
    -- another personnel row (personnel.profile_id is unique), or a
    -- duplicate (personnel_id, attendance_date) pair. Whichever insert
    -- tripped it, both are already rolled back at this point.
    raise exception
      'Could not onboard %: employee_no, profile_id, or attendance date already in use.',
      p_full_name
      using errcode = '23505';
  when others then
    -- Anything else (bad enum value, null violation, etc.) -- rollback
    -- already happened; just propagate so the caller sees the real error.
    raise;
end;
$$;

-- Only the backend's service-role connection calls this (see
-- backend/src/lib/personnelSync.ts and
-- backend/src/routes/personnelOnboarding.ts) -- it's never exposed to
-- an authenticated end-user's own Postgres role.
grant execute on function public.create_personnel_with_attendance(
  text, text, text, date, text, text, uuid, date, text
) to service_role;
