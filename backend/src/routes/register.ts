import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// Public self-registration for FRSMS staff/responders. Unlike
// /api/staff-accounts (admin-only, creates active accounts directly),
// this route is reachable by anyone. Accounts are landed as
// status = 'active' immediately -- no administrator approval step --
// so a new registrant can sign in and reach the dashboard right away.
// role is still always forced to 'staff' below; only an administrator
// can promote an account to 'admin' from Staff Accounts.
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
  // Use upsert (not insert) keyed on id: creating the auth user above
  // fires the on_auth_user_created trigger (added for Google OAuth
  // sign-ins), which already inserts a bare-bones pending profile row
  // for this id a moment before we get here. A plain insert would
  // collide with that row and fail with "duplicate key value violates
  // unique constraint profiles_pkey" -- upsert overwrites it with the
  // fuller registration-form details instead. If the trigger doesn't
  // exist/didn't fire, this still behaves like a normal insert.
  let username = baseUsername;
  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: created.user.id,
        username,
        full_name,
        role: 'staff',
        status: 'active',
        phone,
        position,
        station,
        notes: notes && String(notes).trim() ? String(notes).trim() : null,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  // This 23505 now only ever means the *username* (not id) collided
  // with a different, unrelated account -- retry once with a suffixed
  // username.
  if (profileError && profileError.code === '23505') {
    username = `${baseUsername}-${created.user.id.slice(0, 4)}`;
    ({ data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: created.user.id,
          username,
          full_name,
          role: 'staff',
          status: 'active',
          phone,
          position,
          station,
          notes: notes && String(notes).trim() ? String(notes).trim() : null,
        },
        { onConflict: 'id' }
      )
      .select()
      .single());
  }

  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ error: profileError.message });
  }

  res.status(201).json({
    message: 'Registration successful. You can now sign in.',
    profile,
  });
});

// Completes registration for a "Continue with Google" sign-in. Google
// OAuth gives us an authenticated identity but none of the FRSMS-specific
// fields (position, station, phone) that /api/register above collects --
// and supabase/add_google_oauth_profile_trigger.sql already dropped a
// bare-bones `status = 'pending'` profile row in place the moment the
// Google sign-in created their auth.users row. This route lets that
// still-pending account fill in the rest, same as a manual registrant,
// and flips it straight to 'active' -- no administrator review step.
//
// requireAuth (via the isOAuthCompleteRoute exception) lets a 'pending'
// account reach this one route despite not being 'active' yet -- and
// role is always forced server-side below, never taken from the request
// body, so there's no way for someone to grant themselves admin access
// through this endpoint. The .eq('status', 'pending') guard below means
// this can only ever fire once per account (a *disabled* account can't
// use it to quietly reinstate itself, and an already-active one can't
// replay it to overwrite its fields).
router.post('/complete-oauth', requireAuth, async (req: AuthedRequest, res) => {
  const { full_name, position, station, phone, notes } = req.body ?? {};

  const missing = ['position', 'station', 'phone'].filter((field) => !String(req.body?.[field] ?? '').trim());
  if (missing.length) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...(full_name && String(full_name).trim() ? { full_name: String(full_name).trim() } : {}),
      position,
      station,
      phone,
      notes: notes && String(notes).trim() ? String(notes).trim() : null,
      // role is forced regardless of anything in the request body --
      // completing this form can never itself grant admin access.
      role: 'staff',
      status: 'active',
    })
    .eq('id', req.user!.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error || !profile) {
    return res.status(403).json({ error: 'Only a pending account can complete registration this way.' });
  }

  res.status(200).json({
    message: 'Registration complete. You can now use FRSMS.',
    profile,
  });
});

export default router;
