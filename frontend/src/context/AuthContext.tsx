import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api, isBackendUnreachable } from '../lib/api';
import { demoProfile } from '../lib/demoData';

export interface Profile {
  id: string;
  email: string | null;
  role: 'admin' | 'staff';
  username: string;
  full_name: string;
  status?: 'active' | 'pending' | 'disabled';
  avatar_url?: string | null;
  position?: string | null;
  station?: string | null;
  phone?: string | null;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** True while the signed-in account is still 'pending' and hasn't cleared the emailed OTP step yet. */
  requiresOtp: boolean;
  /** Marks the current session's OTP step as complete (called by VerifyOtp.tsx after a successful verifyOtp). */
  markOtpVerified: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// The OTP check is meant to happen once per browser session, not on every
// reload of an already-verified tab -- so we remember it in sessionStorage
// (cleared when the tab/browser closes) keyed by user id, rather than in
// plain component state which would forget on refresh, or localStorage
// which would skip the check on the person's next visit entirely.
function otpStorageKey(userId: string) {
  return `frsms_otp_verified_${userId}`;
}
function readOtpVerified(userId: string): boolean {
  try {
    return sessionStorage.getItem(otpStorageKey(userId)) === '1';
  } catch {
    return false;
  }
}
function writeOtpVerified(userId: string) {
  try {
    sessionStorage.setItem(otpStorageKey(userId), '1');
  } catch {
    // sessionStorage unavailable (private mode, etc.) -- OTP will just be
    // asked again on next check within this session, which is safe.
  }
}

// When the backend (and its `profiles` table) can't be reached, we still
// have the signed-in Supabase Auth user available on the client -- so we
// build a display profile straight from *their* account (Google display
// name, or the local part of their email) instead of showing the generic
// "Demo Administrator" placeholder for a real person.
//
// Deliberately defaults to 'staff', never 'admin'. This fallback exists
// purely so an already-signed-in person isn't dumped on a blank screen
// during a brief backend hiccup (e.g. a Render free-tier cold start) --
// it must never be the thing that hands out elevated access. `status` is
// left unset here; offlineProfile() below decides whether to force it to
// 'pending' depending on whether this session has cleared OTP before.
function profileFromSupabaseUser(user: User): Profile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaName = [meta.full_name, meta.name, meta.display_name].find(
    (v): v is string => typeof v === 'string' && v.trim().length > 0
  );
  const metaAvatar = [meta.avatar_url, meta.picture].find(
    (v): v is string => typeof v === 'string' && v.trim().length > 0
  );
  const fallbackName = user.email ? user.email.split('@')[0] : 'User';

  return {
    id: user.id,
    email: user.email ?? null,
    role: 'staff',
    username: fallbackName,
    full_name: metaName ?? fallbackName,
    avatar_url: metaAvatar ?? null,
  };
}

// Loading the real Supabase session should never take more than this --
// if Supabase itself is unreachable (wrong project URL, offline, etc.)
// we stop waiting and show the login screen instead of a stuck spinner.
const SESSION_TIMEOUT_MS = 6000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Builds the offline fallback profile for a signed-in user, but keeps
  // the OTP gate honest while we do it. Leaving `status` unset lets an
  // already-*active* user reloading mid-hiccup skip straight back in --
  // but for a session that hasn't cleared OTP yet (sessionStorage has no
  // record of it), we don't actually know that; a slow/cold-starting
  // backend right after a brand-new Google sign-up would otherwise leave
  // `status` undefined, `requiresOtp` would read false, and VerifyOtp
  // would bounce the person straight past verification (the "OTP screen
  // flashes then disappears" bug). Defaulting to 'pending' in that case
  // costs an already-active user one redundant OTP screen on a very rare
  // backend hiccup -- far safer than a never-verified account slipping
  // past the gate.
  function offlineProfile(currentUser: User): Profile {
    const fallback = profileFromSupabaseUser(currentUser);
    if (!readOtpVerified(currentUser.id)) fallback.status = 'pending';
    return fallback;
  }

  async function loadProfile(currentUser: User | null | undefined) {
    try {
      const me = await api.get('/me');
      // api.get('/me') never throws when the backend is unreachable -- it
      // silently resolves with the offline demo profile instead. That's
      // correct for genuine Demo Mode, but a *real* signed-in user should
      // see their own Supabase account name, not "Demo Administrator".
      if (isBackendUnreachable() && currentUser) {
        setProfile(offlineProfile(currentUser));
      } else {
        setProfile(me);
      }
    } catch {
      setProfile(currentUser ? offlineProfile(currentUser) : null);
    }
  }

  useEffect(() => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    }, SESSION_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session) {
          setOtpVerified(readOtpVerified(data.session.user.id));
          await loadProfile(data.session.user);
        }
      })
      .catch(() => {
        // Supabase project unreachable/misconfigured -- fall through to
        // the login screen, which offers Demo Mode as a guaranteed path in.
      })
      .finally(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          setLoading(false);
        }
      });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setDemoMode(false);
        setOtpVerified(readOtpVerified(newSession.user.id));
        await loadProfile(newSession.user);
      } else {
        setProfile(null);
        setOtpVerified(false);
      }
    });

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'Could not reach the authentication server. You can use Demo Mode below instead.' };
    }
  }

  function signInDemo() {
    setDemoMode(true);
    setProfile(demoProfile);
    setLoading(false);
  }

  async function signOut() {
    if (demoMode) {
      setDemoMode(false);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut().catch(() => {});
  }

  // Re-fetches the profile without waiting for a Supabase auth state
  // change event. Needed right after a flow that changes the profile
  // row server-side (e.g. completing OAuth registration) but doesn't
  // touch the session itself -- onAuthStateChange never fires for that,
  // so without this the context would keep serving the stale ('pending')
  // profile it loaded at sign-in and ProtectedRoute would misroute.
  async function refreshProfile() {
    if (session) await loadProfile(session.user);
  }

  function markOtpVerified() {
    if (session) writeOtpVerified(session.user.id);
    setOtpVerified(true);
  }

  // 'pending' now means "hasn't cleared the emailed OTP step yet" -- both
  // self-registered (password) and Google sign-in accounts land 'pending'
  // and both go through VerifyOtp.tsx; there's no longer a separate
  // admin-approval step waiting on the other side of it. profile is left
  // out of the undefined/backend-unreachable fallback profile's `status`
  // deliberately (see profileFromSupabaseUser above), so this correctly
  // stays false for an already-approved user reloading mid-hiccup.
  const requiresOtp = !demoMode && !!session && profile?.status === 'pending' && !otpVerified;

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, demoMode, signIn, signInDemo, signOut, refreshProfile, requiresOtp, markOtpVerified }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
