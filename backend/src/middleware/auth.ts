import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    role: 'admin' | 'staff';
    username: string;
    full_name: string;
    status: 'active' | 'pending' | 'disabled';
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

  // /api/me is the one route a pending/disabled account is still allowed
  // to hit -- the frontend needs to read its own status to show the
  // "Awaiting Approval" or "account disabled" screen instead of a dead end.
  // Every other protected route stays locked until an admin sets status
  // back to 'active' in Staff Accounts.
  const isMeRoute = req.baseUrl === '/api/me';
  if (!isMeRoute && profile.status !== 'active') {
    const code = profile.status === 'pending' ? 'ACCOUNT_PENDING' : 'ACCOUNT_DISABLED';
    const message =
      profile.status === 'pending'
        ? 'Your account is awaiting administrator approval.'
        : 'This account has been disabled.';
    return res.status(403).json({ error: code, message });
  }

  req.user = {
    id: userData.user.id,
    email: userData.user.email ?? null,
    role: profile.role,
    username: profile.username,
    full_name: profile.full_name,
    status: profile.status,
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
