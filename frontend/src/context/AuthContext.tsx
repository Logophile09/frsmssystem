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
// intentionally left unset (not forced to 'pending') so a returning,
// already-*activated* user reloading mid-hiccup isn't wrongly bounced to
// the OTP-verification screen; the actual gate against brand-new,
// never-verified sign-ins reaching the dashboard is the OAuth ->
// /register -> complete-oauth routing in Login.tsx/Register.tsx, which
// doesn't depend on the backend responding at sign-in time at all.
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

  async function loadProfile(currentUser: User | null | undefined) {
    try {
      const me = await api.get('/me');
      // api.get('/me') never throws when the backend is unreachable -- it
      // silently resolves with the offline demo profile instead. That's
      // correct for genuine Demo Mode, but a *real* signed-in user should
      // see their own Supabase account name, not "Demo Administrator".
      if (isBackendUnreachable() && currentUser) {
        setProfile(profileFromSupabaseUser(currentUser));
      } else {
        setProfile(me);
      }
    } catch {
      setProfile(currentUser ? profileFromSupabaseUser(currentUser) : null);
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

  // Was the current session established through "Continue with Google"?
  // Supabase records every identity provider that's ever been linked to
  // this auth.users row in app_metadata.providers (and the one used for
  // the *current* sign-in in app_metadata.provider) -- check both so a
  // staff account that has both a password and a linked Google identity
  // is still recognised as a Google sign-in when that's how they signed
  // in this time.
  const isGoogleSession = Boolean(
    session &&
      (session.user.app_metadata?.provider === 'google' ||
        (session.user.app_metadata?.providers as string[] | undefined)?.includes('google'))
  );

  // 'pending' means "hasn't cleared the emailed OTP step yet" for a
  // brand-new self-registered (password) or Google account -- both land
  // 'pending' and go through VerifyOtp.tsx to activate. But most real
  // accounts are pre-created by an admin in Staff Accounts and start out
  // 'active' (see staffAccounts.ts) -- and Supabase links a Google
  // sign-in to that *same* existing auth.users row whenever the emails
  // match, rather than creating a new one, so the account is already
  // 'active' before the on_auth_user_created trigger ever gets a chance
  // to run. Gating solely on status === 'pending' would let every one of
  // those Google sign-ins straight through with no OTP step at all --
  // Google having proven the identity is only one factor; this code is
  // what proves the person also controls that inbox, so it's required
  // for every Google sign-in this browser session regardless of the
  // account's activation status. profile is left out of the
  // undefined/backend-unreachable fallback profile's `status`
  // deliberately (see profileFromSupabaseUser above), so the 'pending'
  // check below correctly stays false for an already-approved user
  // reloading mid-hiccup.
  const requiresOtp =
    !demoMode && !!session && !otpVerified && (profile?.status === 'pending' || isGoogleSession);

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
