import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Any authenticated user can see the roster; only admins can manage it.
router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, role, status, position, station, phone, notes, last_login_at, created_at')
    .order('full_name', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create a new staff/admin account: makes the Supabase Auth user, then
// the matching profile row (role/status/username live in `profiles`,
// Supabase Auth owns the login credential).
router.post('/', requireAdmin, async (req: AuthedRequest, res) => {
  const { email, password, username, full_name, role } = req.body ?? {};
  if (!email || !password || !username || !full_name) {
    return res.status(400).json({ error: 'email, password, username, and full_name are required' });
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
      role: role === 'admin' ? 'admin' : 'staff',
      status: 'active',
    })
    .select()
    .single();

  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ error: profileError.message });
  }

  res.status(201).json(profile);
});

// Toggle active/disabled, or change role.
router.put('/:id', requireAdmin, async (req: AuthedRequest, res) => {
  const { role, status, full_name } = req.body ?? {};
  const patch: Record<string, unknown> = {};
  if (role) patch.role = role;
  if (status) patch.status = status;
  if (full_name) patch.full_name = full_name;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAdmin, async (req: AuthedRequest, res) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

export default router;
