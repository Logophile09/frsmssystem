import { supabaseAdmin } from '../config/supabase';

interface ProfileForPersonnel {
  id: string;
  full_name: string;
  phone?: string | null;
  position?: string | null;
  station?: string | null;
}

interface PersonnelOnboardResult {
  personnel: Record<string, unknown> & { id: number };
  attendance: Record<string, unknown>;
}

/**
 * Gives a staff/admin login account a matching row in the `personnel`
 * roster, linked via `personnel.profile_id` -- AND that row's first
 * `attendance` entry (status: 'off_duty'). Both inserts happen inside
 * create_personnel_with_attendance() (see
 * supabase/add_atomic_personnel_onboarding_migration_2.sql) as one
 * atomic Postgres transaction: either both rows exist afterward, or
 * neither does.
 *
 * This is the "transition" from a login account to a full personnel
 * record:
 *  - for self-registered accounts, it runs the moment the account is
 *    activated -- via the person verifying their emailed OTP (status:
 *    pending -> active) in POST /api/register/verify-otp or
 *    /api/register/complete-oauth, or an administrator manually
 *    activating a still-pending account from Staff Accounts
 *  - for accounts an admin creates directly (already active), it runs
 *    right after creation
 * Safe to call more than once -- it's a no-op if a personnel row is
 * already linked to this profile.
 */
export async function ensurePersonnelRecord(profile: ProfileForPersonnel, email: string | null) {
  const { data: existing } = await supabaseAdmin
    .from('personnel')
    .select('id')
    .eq('profile_id', profile.id)
    .maybeSingle();
  if (existing) return existing;

  const { count } = await supabaseAdmin.from('personnel').select('id', { count: 'exact', head: true });
  const employee_no = `EMP-${1000 + (count ?? 0) + 1}`;

  const { data, error } = await supabaseAdmin.rpc('create_personnel_with_attendance', {
    p_employee_no: employee_no,
    p_full_name: profile.full_name,
    p_rank_title: profile.position || 'Staff',
    p_hire_date: new Date().toISOString().slice(0, 10),
    p_phone: profile.phone ?? null,
    p_email: email,
    p_profile_id: profile.id,
  });

  if (error) {
    // Non-fatal, same as before: the account itself is still
    // approved/created even if the roster row couldn't be added (e.g.
    // an employee_no race on a concurrent approval). An admin can add
    // them to Personnel by hand. Because create_personnel_with_attendance
    // is transactional, we don't have to worry about a half-written
    // personnel row with no attendance row to clean up here.
    // eslint-disable-next-line no-console
    console.error(`[FRSMS] Could not create personnel record for profile ${profile.id}:`, error.message);
    return null;
  }

  return (data as PersonnelOnboardResult).personnel;
}
