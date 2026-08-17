import { supabaseAdmin } from '../config/supabase';

interface ProfileForPersonnel {
  id: string;
  full_name: string;
  phone?: string | null;
  position?: string | null;
  station?: string | null;
}

/**
 * Gives a staff/admin login account a matching row in the `personnel`
 * roster, linked via `personnel.profile_id`. This is the "transition"
 * from a login account to a full personnel record:
 *  - for self-registered accounts, it runs the moment an admin approves
 *    them (status: pending -> active) in Staff Accounts
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

  const { data, error } = await supabaseAdmin
    .from('personnel')
    .insert({
      employee_no,
      full_name: profile.full_name,
      rank_title: profile.position || 'Staff',
      phone: profile.phone ?? null,
      email,
      status: 'off_duty',
      hire_date: new Date().toISOString().slice(0, 10),
      profile_id: profile.id,
    })
    .select()
    .single();

  if (error) {
    // Non-fatal: the account itself is still approved/created even if
    // the roster row couldn't be added (e.g. employee_no race on a
    // concurrent approval). An admin can add them to Personnel by hand.
    // eslint-disable-next-line no-console
    console.error(`[FRSMS] Could not create personnel record for profile ${profile.id}:`, error.message);
    return null;
  }
  return data;
}
