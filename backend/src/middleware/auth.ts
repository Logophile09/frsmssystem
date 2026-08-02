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

/**
 * Every request to a protected route must send:
 *   Authorization: Bearer <supabase access token>
 * (the frontend gets this token from supabase.auth.getSession() after
 * the user logs in via Supabase Auth).
 *
 * We verify the token with Supabase, then load the matching row from
 * `profiles` to get the app-level role/status -- Supabase Auth itself
 * only knows about the login identity, not FRSMS roles.
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, role, status')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: 'No profile found for this account' });
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
