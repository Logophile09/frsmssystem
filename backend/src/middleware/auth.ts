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
    avatar_url: string | null;
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
    .select('id, username, full_name, role, status, avatar_url')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: 'No profile found for this account' });
  }

  // /api/me is the one route a pending/disabled account is still allowed
  // to hit -- the frontend needs to read its own status to show the
  // "Awaiting Approval" or "account disabled" screen instead of a dead end.
  // /api/register/complete-oauth is the other exception: a brand-new
  // Google OAuth sign-in lands with a bare-bones 'pending' profile (see
  // supabase/add_google_oauth_profile_trigger.sql) that's missing the
  // position/station/phone fields the email/password path collects on
  // /register -- this route lets a still-pending account fill those in.
  // It still can't reach anything else until an admin approves it.
  const isMeRoute = req.baseUrl === '/api/me';
  const isOAuthCompleteRoute = req.baseUrl === '/api/register' && req.path === '/complete-oauth';
  if (!isMeRoute && !isOAuthCompleteRoute && profile.status !== 'active') {
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
    avatar_url: profile.avatar_url ?? null,
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
