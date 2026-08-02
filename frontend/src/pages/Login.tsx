import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Edit these to match your station. To use a real photo of your station as
// the background, drop it in frontend/public/ (e.g. station-photo.jpg) and
// set BACKGROUND_IMAGE below to '/station-photo.jpg'. Leave it null to use
// the built-in CSS atmosphere instead (no photo needed).
const AGENCY_NAME = 'Barangay Culiat Government';
const AGENCY_TAGLINE = 'Integrated Public Safety & Security';
const STATION_NAME = "Barangay Culiat's fire and rescue station";
const EMERGENCY_NUMBER = '911';
const BACKGROUND_IMAGE: string | null = null;

export default function Login() {
  const { session, demoMode, signIn, signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (session || demoMode) return <Navigate to="/" replace />;

  function handleDemoEntry() {
    signInDemo();
    navigate((location.state as any)?.from ?? '/', { replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) setError(result.error);
    else navigate((location.state as any)?.from ?? '/', { replace: true });
  }

  async function handleOAuth(provider: 'google' | 'facebook') {
    setError(null);
    setOauthLoading(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-950">
      {/* Background: real photo if provided, otherwise a generated dark navy/gold atmosphere */}
      {BACKGROUND_IMAGE ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
        />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-black" />
          {/* faint skyline silhouette */}
          <svg className="absolute bottom-0 left-0 h-64 w-full opacity-25" viewBox="0 0 1600 300" preserveAspectRatio="none">
            <rect x="0" y="140" width="180" height="160" fill="#060a12" />
            <rect x="200" y="80" width="140" height="220" fill="#060a12" />
            <rect x="360" y="160" width="120" height="140" fill="#060a12" />
            <rect x="500" y="60" width="160" height="240" fill="#060a12" />
            <rect x="680" y="120" width="130" height="180" fill="#060a12" />
            <rect x="830" y="40" width="150" height="260" fill="#060a12" />
            <rect x="1000" y="150" width="140" height="150" fill="#060a12" />
            <rect x="1160" y="90" width="160" height="210" fill="#060a12" />
            <rect x="1340" y="130" width="260" height="170" fill="#060a12" />
          </svg>
          {/* subtle gold radial glow behind the sign-in card */}
          <div
            className="absolute right-[-10%] top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl"
            style={{ background: 'radial-gradient(circle, #d8ad3f 0%, transparent 70%)' }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #d8ad3f 1px, transparent 1px), linear-gradient(to bottom, #d8ad3f 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
        </div>
      )}
      {/* Dark overlay so text/cards stay legible regardless of background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />

      <div className="relative flex min-h-screen flex-col">
        {/* Header / brand bar */}
        <header className="flex items-center justify-between border-b border-gold-400/20 px-6 py-5 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-gold-400 bg-white shadow-[0_0_18px_rgba(216,173,63,0.35)] transition-shadow duration-300 hover:shadow-[0_0_28px_rgba(216,173,63,0.55)]">
              <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-300">{AGENCY_NAME}</p>
              <p className="font-display text-sm font-semibold text-white">{AGENCY_TAGLINE}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-950/60 px-4 py-1.5 text-xs font-bold text-rose-200 shadow-lg shadow-black/40 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
            Emergency: {EMERGENCY_NUMBER}
          </div>
        </header>

        {/* Main split */}
        <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-12 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          {/* Left: hero copy */}
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-0.5 w-8 bg-gold-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gold-300">
                Fire &amp; Rescue Service Management
              </span>
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Command every response, from the <span className="text-gold-300">first call</span> to{' '}
              <span className="text-gold-300">close-out</span>.
            </h1>
            <p className="mt-5 max-w-md text-slate-300">
              Sign in to access live dispatch, unit tracking, resource management, and incident reporting for{' '}
              {STATION_NAME}.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Live Dispatch', 'Unit Tracking', 'Incident Reports'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gold-400/30 bg-white/5 px-3 py-1 text-xs font-medium text-gold-200 backdrop-blur transition-colors duration-300 hover:border-gold-400/60 hover:bg-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: sign-in card */}
          <div className="w-full max-w-sm rounded-2xl border border-gold-400/20 bg-navy-900/80 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(216,173,63,0.08)]">
            <h2 className="font-display text-xl font-bold text-white">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-400">Sign in to your console</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.gov"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                />
              </div>

              {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-gold-300 to-gold-500 py-2.5 text-sm font-semibold text-navy-950 shadow-lg shadow-gold-500/20 transition-all duration-300 hover:from-gold-200 hover:to-gold-400 hover:shadow-gold-400/30 disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleDemoEntry}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gold-400/30 bg-gold-400/5 py-2.5 text-sm font-semibold text-gold-200 transition-colors duration-300 hover:bg-gold-400/15"
            >
              View Demo (no account needed)
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Explores the full system with sample data — no Supabase login required.
            </p>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={oauthLoading !== null}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-200 transition-colors duration-300 hover:border-gold-400/30 hover:bg-white/10 disabled:opacity-60"
              >
                <GoogleIcon />
                {oauthLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('facebook')}
                disabled={oauthLoading !== null}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-200 transition-colors duration-300 hover:border-gold-400/30 hover:bg-white/10 disabled:opacity-60"
              >
                <FacebookIcon />
                {oauthLoading === 'facebook' ? 'Redirecting…' : 'Continue with Facebook'}
              </button>
            </div>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
              Accounts are created by an administrator in Staff Accounts.
              <br />
              Authentication is handled by Supabase Auth.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.7 26.9 36 24 36c-5.3 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.9 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </svg>
  );
}
