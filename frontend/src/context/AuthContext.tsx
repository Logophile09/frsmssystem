import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { demoProfile } from '../lib/demoData';

export interface Profile {
  id: string;
  email: string | null;
  role: 'admin' | 'staff';
  username: string;
  full_name: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Loading the real Supabase session should never take more than this --
// if Supabase itself is unreachable (wrong project URL, offline, etc.)
// we stop waiting and show the login screen instead of a stuck spinner.
const SESSION_TIMEOUT_MS = 6000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  async function loadProfile() {
    try {
      const me = await api.get('/me');
      setProfile(me);
    } catch {
      setProfile(null);
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
        if (data.session) await loadProfile();
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
        await loadProfile();
      } else {
        setProfile(null);
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

  return (
    <AuthContext.Provider value={{ session, profile, loading, demoMode, signIn, signInDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
