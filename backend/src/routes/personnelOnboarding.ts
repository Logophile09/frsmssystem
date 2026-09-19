import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// POST /api/personnel-onboarding
//
// Admin-only. Creates a Personnel Roster row AND its first Attendance
// row (status: 'off_duty') in one atomic database transaction, via the
// create_personnel_with_attendance() Postgres function -- see
// supabase/add_atomic_personnel_onboarding_migration_2.sql. This is the
// direct-add path (parallel to Staff Accounts creating an active login
// account outright); self-registered accounts go through
// lib/personnelSync.ts -> ensurePersonnelRecord() instead, once their
// account is activated.
router.post('/', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { employee_no, full_name, rank_title, phone, email, hire_date, profile_id, attendance_date } =
    req.body ?? {};

  const missing = ['employee_no', 'full_name', 'rank_title', 'hire_date'].filter(
    (field) => !String(req.body?.[field] ?? '').trim()
  );
  if (missing.length) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
  }

  const { data, error } = await supabaseAdmin.rpc('create_personnel_with_attendance', {
    p_employee_no: String(employee_no).trim(),
    p_full_name: String(full_name).trim(),
    p_rank_title: String(rank_title).trim(),
    p_hire_date: hire_date,
    p_phone: phone ?? null,
    p_email: email ?? null,
    p_profile_id: profile_id ?? null,
    p_attendance_date: attendance_date ?? new Date().toISOString().slice(0, 10),
  });

  if (error) {
    // The Postgres function has already rolled back both inserts by
    // the time any error reaches here -- there's nothing for this
    // controller to undo. It just needs to translate the DB error into
    // the right HTTP status:
    if (error.code === '23505') {
      // duplicate employee_no / profile_id / (personnel_id, attendance_date)
      return res.status(409).json({ error: error.message });
    }
    if (error.code === '22004') {
      // required field failed validation inside the function
      return res.status(400).json({ error: error.message });
    }
    // eslint-disable-next-line no-console
    console.error('[FRSMS] create_personnel_with_attendance failed:', error);
    return res.status(500).json({ error: 'Could not create personnel record.' });
  }

  const { personnel, attendance } = data as { personnel: unknown; attendance: unknown };
  res.status(201).json({ personnel, attendance });
});

export default router;
