import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, isSuperAdmin, requireAdmin, requireAuth } from '../middleware/auth';
import { ensurePersonnelRecord } from '../lib/personnelSync';

const router = Router();
router.use(requireAuth);

function normalizeRole(role?: string): string {
  if (!role) return 'staff';
  const r = String(role).trim().toLowerCase();
  if (r === 'super_admin' || r === 'super admin') return 'super_admin';
  if (r === 'admin') return 'admin';
  if (r === 'staff' || r === 'user') return 'staff';
  if (r === 'brgy_official' || r === 'official') return 'brgy_official';
  if (r === 'citizen') return 'citizen';
  if (r === 'non_citizen' || r === 'guest') return 'non_citizen';
  return 'staff';
}

// Any authenticated user can see the roster; only admins/super admins can manage it.
router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, role, status, position, station, phone, notes, avatar_url, last_login_at, created_at')
    .order('full_name', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create a new user/staff/admin/super_admin account: makes the Supabase Auth user,
// then the matching profile row.
router.post('/', requireAdmin, async (req: AuthedRequest, res) => {
  const { email, password, username, full_name, role } = req.body ?? {};
  if (!email || !password || !username || !full_name) {
    return res.status(400).json({ error: 'email, password, username, and full_name are required' });
  }

  const targetRole = normalizeRole(role);
  if (targetRole === 'super_admin' && !isSuperAdmin(req.user?.role)) {
    return res.status(403).json({ error: 'Only Super Admins can create Super Admin accounts.' });
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created?.user) {
    return res.status(400).json({ error: createError?.message ?? 'Could not create the account' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: created.user.id,
      username,
      full_name,
      role: targetRole,
      status: 'active',
    })
    .select()
    .single();

  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ error: profileError.message });
  }

  // Users / Staff are operational responders -- link them to personnel roster
  if (profile.role === 'staff' || profile.role === 'user') {
    await ensurePersonnelRecord(profile, email);
  }

  res.status(201).json(profile);
});

// Toggle active/disabled, or change role.
router.put('/:id', requireAdmin, async (req: AuthedRequest, res) => {
  const { role, status, full_name } = req.body ?? {};

  // Check target user's current profile to enforce role hierarchy
  const { data: targetProfile, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', req.params.id)
    .single();

  if (fetchErr || !targetProfile) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const requesterIsSuperAdmin = isSuperAdmin(req.user?.role);
  const targetIsSuperAdmin = isSuperAdmin(targetProfile.role);

  // An admin cannot modify or demote a Super Admin
  if (targetIsSuperAdmin && !requesterIsSuperAdmin) {
    return res.status(403).json({ error: 'Only Super Admins can modify a Super Admin account.' });
  }

  const patch: Record<string, unknown> = {};
  if (role) {
    const newRole = normalizeRole(role);
    if (newRole === 'super_admin' && !requesterIsSuperAdmin) {
      return res.status(403).json({ error: 'Only Super Admins can assign the Super Admin role.' });
    }
    patch.role = newRole;
  }
  if (status) patch.status = status;
  if (full_name) patch.full_name = full_name;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  if (data.status === 'active' && (data.role === 'staff' || data.role === 'user')) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.id);
    await ensurePersonnelRecord(data, authUser?.user?.email ?? null);
  }

  res.json(data);
});

router.delete('/:id', requireAdmin, async (req: AuthedRequest, res) => {
  if (req.user?.id === req.params.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', req.params.id)
    .single();

  if (targetProfile && isSuperAdmin(targetProfile.role) && !isSuperAdmin(req.user?.role)) {
    return res.status(403).json({ error: 'Only Super Admins can delete a Super Admin account.' });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

export default router;
