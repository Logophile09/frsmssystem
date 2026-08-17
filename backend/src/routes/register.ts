import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Public self-registration for FRSMS staff/responders. Unlike
// /api/staff-accounts (admin-only, creates active accounts directly),
// this route is reachable by anyone and always lands the new account
// as status = 'pending' -- it can't sign in to any protected route
// until an administrator approves it from Staff Accounts.
router.post('/', async (req, res) => {
  const { email, password, first_name, last_name, phone, position, station, notes } = req.body ?? {};

  const missing = ['email', 'password', 'first_name', 'last_name', 'phone', 'position', 'station'].filter(
    (field) => !String(req.body?.[field] ?? '').trim()
  );
  if (missing.length) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const full_name = `${first_name} ${last_name}`.trim();
  const baseUsername = String(email).split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'staff';

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created?.user) {
    return res.status(400).json({ error: createError?.message ?? 'Could not create the account' });
  }

  // Username must be unique -- if the natural one is taken, suffix it
  // with a short slice of the new user's id rather than failing outright.
  let username = baseUsername;
  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: created.user.id,
      username,
      full_name,
      role: 'staff',
      status: 'pending',
      phone,
      position,
      station,
      notes: notes && String(notes).trim() ? String(notes).trim() : null,
    })
    .select()
    .single();

  if (profileError && profileError.code === '23505') {
    username = `${baseUsername}-${created.user.id.slice(0, 4)}`;
    ({ data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: created.user.id,
        username,
        full_name,
        role: 'staff',
        status: 'pending',
        phone,
        position,
        station,
        notes: notes && String(notes).trim() ? String(notes).trim() : null,
      })
      .select()
      .single());
  }

  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ error: profileError.message });
  }

  res.status(201).json({
    message: 'Registration received. An administrator will review your account shortly.',
    profile,
  });
});

export default router;
