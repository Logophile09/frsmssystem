import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export type UserRole = 'super_admin' | 'admin' | 'user' | 'staff' | 'super admin';

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'super_admin' || role === 'super admin';
}

export function isAdmin(role?: string | null): boolean {
  return isSuperAdmin(role) || role === 'admin';
}

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    role: UserRole;
    username: string;
    full_name: string;
    status: 'active' | 'pending' | 'disabled';
    avatar_url: string | null;
    position: string | null;
    station: string | null;
    phone: string | null;
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
    .select('id, username, full_name, role, status, avatar_url, position, station, phone')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: 'No profile found for this account' });
  }

  // /api/me is the one route a pending/disabled account is still allowed
  // to hit -- the frontend needs to read its own status to show the
  // "Verify your email" or "account disabled" screen instead of a dead end.
  // /api/register/complete-oauth and /api/register/verify-otp are the other
  // exceptions, both reachable only by a still-pending account fixing up
  // its own row:
  //  - complete-oauth: a brand-new Google OAuth sign-in lands with a
  //    bare-bones 'pending' profile (see
  //    supabase/add_google_oauth_profile_trigger.sql) that's missing the
  //    position/station/phone fields the email/password path collects on
  //    /register -- this route lets a still-pending account fill those in.
  //  - verify-otp: the account's one and only path from 'pending' to
  //    'active' now that there's no admin approval step -- the frontend
  //    calls it right after the person proves control of their inbox via
  //    Supabase's own auth.verifyOtp (see VerifyOtp.tsx).
  const isMeRoute = req.baseUrl === '/api/me';
  const isOAuthCompleteRoute = req.baseUrl === '/api/register' && req.path === '/complete-oauth';
  const isVerifyOtpRoute = req.baseUrl === '/api/register' && req.path === '/verify-otp';
  if (!isMeRoute && !isOAuthCompleteRoute && !isVerifyOtpRoute && profile.status !== 'active') {
    const code = profile.status === 'pending' ? 'ACCOUNT_PENDING' : 'ACCOUNT_DISABLED';
    const message =
      profile.status === 'pending'
        ? 'Please verify your email to activate your account.'
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
    position: profile.position ?? null,
    station: profile.station ?? null,
    phone: profile.phone ?? null,
  };

  next();
}

/** Restrict a route to admins or super admins (e.g. Staff Accounts management). */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!isAdmin(req.user?.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/** Restrict a route exclusively to super admins. */
export function requireSuperAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!isSuperAdmin(req.user?.role)) {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
}
