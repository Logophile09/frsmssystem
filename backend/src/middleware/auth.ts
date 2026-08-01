import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    role: 'admin' | 'staff';
    username: string;
    full_name: string;
  };
}

function usernameFromEmail(email: string | null | undefined, fallbackId: string) {
  if (!email) return `user-${fallbackId.slice(0, 8)}`;
  return email.split('@')[0];
}

/**
 * Every request to a protected route must send:
 *   Authorization: Bearer <supabase access token>
 * (the frontend gets this token from supabase.auth.getSession() after
 * the user logs in via Supabase Auth).
 *
 * We verify the token with Supabase, then load the matching row from
 * `profiles` to get the app-level role/status -- Supabase Auth itself
 * only knows about the login identity, not FRSMS roles.
 *
 * First-time Google/Facebook sign-ins won't have a `profiles` row yet
 * (email/password accounts are created by an admin in Staff Accounts
 * ahead of time, but OAuth accounts are created by the provider at
 * login time). Rather than reject those with no path forward, we
 * auto-create a 'pending' profile and still block access -- an admin
 * has to approve it in Staff Accounts before it can do anything. This
 * keeps "accounts are admin-provisioned" true even for social login.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, role, status')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile) {
    // No profile yet -- this is a first-time OAuth login. Auto-create a
    // pending one rather than leaving the account in limbo.
    const meta = userData.user.user_metadata ?? {};
    const { data: created, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.user.id,
        username: usernameFromEmail(userData.user.email, userData.user.id),
        full_name: meta.full_name ?? meta.name ?? userData.user.email ?? 'New User',
        role: 'staff',
        status: 'pending',
      })
      .select('id, username, full_name, role, status')
      .single();

    if (createError || !created) {
      return res.status(403).json({ error: 'No profile found for this account, and one could not be created.' });
    }
    profile = created;
  }

  if (profile.status === 'pending') {
    return res.status(403).json({
      error: 'Your account was created via social login and is pending administrator approval. Ask an admin to activate it in Staff Accounts.',
    });
  }

  if (profile.status === 'disabled') {
    return res.status(403).json({ error: 'This account has been disabled' });
  }

  req.user = {
    id: userData.user.id,
    email: userData.user.email ?? null,
    role: profile.role,
    username: profile.username,
    full_name: profile.full_name,
  };

  next();
}

/** Restrict a route to admins (e.g. Staff Accounts management). */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
