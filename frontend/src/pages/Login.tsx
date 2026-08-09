import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Radio,
  ShieldCheck,
  BrainCircuit,
  Flame,
  CheckCircle2,
  UserRound,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Truck,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#ai', label: 'AI Technology' },
  { href: '/#modules', label: 'Modules' },
  { href: '/#about', label: 'About' },
];

const HERO_FEATURES = [
  { icon: Radio, title: 'Live Dispatch', desc: 'Real-time incident monitoring and dispatch.' },
  { icon: Truck, title: 'Unit Tracking', desc: 'Track units and responders live on the map.' },
  { icon: ClipboardList, title: 'Incident Reports', desc: 'Create, view and manage incident reports.' },
];

export default function Login() {
  const { session, demoMode, signIn, signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // `transitioning` intentionally holds off the redirect for a beat so the
  // success overlay below gets to play instead of an instant jump-cut.
  if ((session || demoMode) && !transitioning) return <Navigate to="/dashboard" replace />;

  function goToDashboard() {
    setTransitioning(true);
    window.setTimeout(() => {
      navigate((location.state as any)?.from ?? '/dashboard', { replace: true });
    }, 700);
  }

  function handleDemoEntry() {
    signInDemo();
    goToDashboard();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) setError(result.error);
    else goToDashboard();
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
    <div className="min-h-screen bg-white">
      <div
        className={`animate-page-in transition-opacity duration-500 ${
          transitioning ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {/* Navbar — same as the home page so Sign In / Register are always reachable */}
        <header className="sticky top-0 z-50 border-b border-navy-700/40 bg-navy-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-leaf-400 bg-white shadow-[0_0_14px_rgba(224,160,23,0.35)]">
                <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-bold uppercase tracking-widest text-leaf-400">Republic of the Philippines</p>
                <p className="font-display text-base font-bold text-white">Barangay Culiat</p>
                <p className="text-[11px] text-navy-200">Quezon City &middot; Emergency Response System</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-navy-100 transition-colors duration-300 hover:text-leaf-300"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-lg border border-leaf-400/50 bg-leaf-400/10 px-4 py-2 text-sm font-semibold text-leaf-300 sm:flex">
                <UserRound size={15} /> Sign In
              </span>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg bg-flagred-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-flagred-500/20 transition-colors duration-300 hover:bg-flagred-600"
              >
                <UserPlus size={15} /> Register
              </Link>
            </div>
          </div>

          {/* Hotline bar */}
          <div className="bg-flagred-500">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white">
              <Radio size={15} className="shrink-0" />
              24/7 Emergency Hotline: <span className="font-extrabold">911</span>
            </div>
          </div>
        </header>

        {/* Hero + sign-in card */}
        <section className="relative overflow-hidden bg-navy-900">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/station-photo.png')", backgroundPosition: 'center 30%' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(115deg, rgba(10,18,30,0.97) 20%, rgba(10,18,30,0.85) 55%, rgba(10,18,30,0.6) 100%)',
            }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-leaf-400/50 bg-leaf-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-leaf-300">
                  Bagong Pilipinas
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/5 px-3 py-1 text-xs font-semibold text-white/90">
                  <BrainCircuit size={13} /> AI-Enhanced Emergency Response
                </span>
              </div>

              <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
                When seconds matter, <span className="text-leaf-300">we respond faster.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
                The official emergency response system of Barangay Culiat, Quezon City — connecting citizens
                with responders through an AI-powered platform under the Bagong Pilipinas governance agenda.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="tel:911"
                  className="flex items-center gap-2 rounded-lg bg-flagred-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-flagred-500/25 transition-colors duration-300 hover:bg-flagred-600"
                >
                  <Flame size={16} /> Report an Emergency
                </a>
                <span className="flex items-center gap-2 rounded-lg border border-leaf-400/50 bg-leaf-400/10 px-5 py-3 text-sm font-bold text-leaf-300">
                  <ShieldCheck size={16} /> Admin / Responder Login
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {['PWD-Accessible', 'Works Offline (PWA)', 'Real-Time GPS', 'Role-Based Security'].map((t) => (
                  <span key={t} className="flex items-center gap-2 text-sm text-navy-100">
                    <CheckCircle2 size={15} className="text-leaf-400" /> {t}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {HERO_FEATURES.map((f) => (
                  <div key={f.title} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <f.icon size={18} className="text-flagred-400" />
                    <p className="mt-2 text-sm font-bold text-white">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-navy-200">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign-in card */}
            <div className="w-full max-w-sm justify-self-center rounded-2xl border border-white/10 bg-navy-950/90 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-leaf-400 bg-white shadow-[0_0_18px_rgba(206,17,38,0.35)]">
                  <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-white">Welcome Back</h2>
                <p className="mt-1 text-sm text-navy-300">Sign in to your console</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-navy-200">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@agency.gov"
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-navy-400 focus:border-leaf-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-leaf-400/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-navy-200">Password</label>
                  <div className="relative">
                    <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-navy-400 focus:border-leaf-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-leaf-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-navy-200">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-flagred-500 focus:ring-flagred-400"
                    />
                    Remember me
                  </label>
                  <a href="#" className="font-semibold text-flagred-400 hover:text-flagred-300">
                    Forgot Password?
                  </a>
                </div>

                {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-flagred-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-flagred-500/25 transition-colors duration-300 hover:bg-flagred-600 disabled:opacity-60"
                >
                  {submitting ? 'Signing in…' : 'Sign In'} <ArrowRight size={15} />
                </button>
              </form>

              <button
                type="button"
                onClick={handleDemoEntry}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-leaf-400/30 bg-leaf-400/5 py-2.5 text-sm font-semibold text-leaf-200 transition-colors duration-300 hover:bg-leaf-400/15"
              >
                View Demo (no account needed)
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-navy-400">Or continue with</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-navy-100 transition-colors duration-300 hover:border-leaf-400/30 hover:bg-white/10 disabled:opacity-60"
                >
                  <GoogleIcon />
                  {oauthLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('facebook')}
                  disabled={oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-navy-100 transition-colors duration-300 hover:border-leaf-400/30 hover:bg-white/10 disabled:opacity-60"
                >
                  <FacebookIcon />
                  {oauthLoading === 'facebook' ? 'Redirecting…' : 'Continue with Facebook'}
                </button>
              </div>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-navy-400">
                Accounts are created by an administrator in Staff Accounts.
                <br />
                Authentication is handled by Supabase Auth.
              </p>
            </div>
          </div>

          {/* Flag-colored divider */}
          <div className="relative flex h-1.5 w-full">
            <div className="flex-1 bg-navy-500" />
            <div className="flex-1 bg-flagred-500" />
            <div className="flex-1 bg-leaf-400" />
          </div>
        </section>
      </div>

      {transitioning && (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-navy-950 animate-page-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-flagred-400 to-flagred-600 shadow-lg shadow-flagred-500/40 animate-leaf-pulse">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-display text-lg font-semibold text-white">Welcome back</p>
          <p className="text-sm text-slate-400">Loading your dashboard…</p>
        </div>
      )}
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
