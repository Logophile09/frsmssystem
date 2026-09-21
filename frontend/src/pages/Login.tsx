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
  Sun,
  Moon,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { AuthModeSwitch, AuthFlipTransition } from '../components/AuthModeSwitch';
import { AuthBackgroundFX } from '../components/AuthBackgroundFX';

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
  const { session, demoMode, signIn, signInDemo, switchDemoRole } = useAuth();
  const { dark, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = Boolean((location.state as any)?.registered);

  // `transitioning` intentionally holds off the redirect for a beat so the
  // success overlay below gets to play instead of an instant jump-cut.
  if ((session || demoMode) && !transitioning) return <Navigate to="/dashboard" replace />;

  function goToDashboard() {
    setTransitioning(true);
    window.setTimeout(() => {
      navigate((location.state as any)?.from ?? '/dashboard', { replace: true });
    }, 700);
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

  async function handleOAuth(provider: 'google') {
    setError(null);
    setOauthLoading(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      // Land back on /verify-otp, not /register -- a Google sign-in now
      // has to clear the emailed OTP step before it can reach the
      // registration-completion form or the dashboard. VerifyOtp.tsx
      // forwards to the right place afterward.
      provider,
      options: { redirectTo: `${window.location.origin}/verify-otp` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div
        className={`animate-page-in transition-opacity duration-500 ${
          transitioning ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {/* Navbar */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-white shadow-[0_0_14px_rgba(224,160,23,0.35)]">
                <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Republic of the Philippines</p>
                <p className="font-display text-base font-bold text-foreground">Barangay Culiat</p>
                <p className="text-[11px] text-muted-foreground">Quezon City &middot; Emergency Response System</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-primary"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => toggle(e)}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle theme"
                className="btn-icon !h-10 !w-10"
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <span className="hidden items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary sm:flex">
                <UserRound size={15} /> Sign In
              </span>
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl"
              >
                <UserPlus size={15} /> Register
              </Link>
            </div>
          </div>

          {/* Hotline bar */}
          <div className="bg-primary transition-colors duration-300">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-primary-foreground">
              <Radio size={15} className="shrink-0 animate-pulse" />
              24/7 Emergency Hotline: <a href="tel:911" className="font-extrabold underline underline-offset-2 hover:opacity-90">911</a>
            </div>
          </div>
        </header>

        {/* Hero + sign-in card */}
        <section className="relative overflow-hidden bg-slate-50/70 transition-colors duration-500 dark:bg-navy-950">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 transition-opacity duration-500 dark:opacity-30"
            style={{ backgroundImage: "url('/station-photo.png')", backgroundPosition: 'center 30%' }}
          />
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              background: dark
                ? 'linear-gradient(115deg, rgba(8,15,28,0.97) 20%, rgba(10,18,30,0.88) 55%, rgba(10,18,30,0.65) 100%)'
                : 'linear-gradient(115deg, rgba(255,255,255,0.95) 20%, rgba(248,250,252,0.75) 55%, rgba(240,253,244,0.45) 100%)',
            }}
          />
          <AuthBackgroundFX variant={dark ? 'dark' : 'light'} />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2.5">
                <span className="rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-700 transition-colors dark:border-leaf-400/50 dark:bg-leaf-400/10 dark:text-leaf-300">
                  Bagong Pilipinas
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white/80 px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition-colors dark:border-white/25 dark:bg-white/5 dark:text-white/90">
                  <BrainCircuit size={13} className="text-emerald-600 dark:text-leaf-300" /> AI-Enhanced Emergency Response
                </span>
              </div>

              <h1 className="font-display text-4xl font-bold leading-tight text-slate-950 transition-colors sm:text-5xl dark:text-white">
                When seconds matter, <span className="text-emerald-600 drop-shadow-sm dark:text-leaf-300">we respond faster.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 transition-colors sm:text-lg dark:text-navy-100">
                The official emergency response system of Barangay Culiat, Quezon City — connecting citizens
                with responders through an AI-powered platform under the Bagong Pilipinas governance agenda.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <a
                  href="tel:911"
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-xl hover:shadow-emerald-600/40"
                >
                  <Phone size={16} className="transition-transform duration-300 group-hover:scale-110" /> Report an Emergency
                </a>
                <span className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-bold text-primary">
                  <ShieldCheck size={16} /> Admin / Responder Login
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                {['PWD-Accessible', 'Works Offline (PWA)', 'Real-Time GPS', 'Role-Based Security'].map((t) => (
                  <span key={t} className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors dark:text-navy-100">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-leaf-400 shrink-0" /> {t}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {HERO_FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                  >
                    <f.icon size={18} className="text-primary" />
                    <p className="mt-2 text-sm font-bold text-foreground dark:text-white">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground dark:text-navy-200">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign-in card */}
            <AuthFlipTransition>
            <div className="w-full max-w-sm justify-self-center rounded-2xl border border-border bg-card/95 p-7 shadow-2xl backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-navy-950/90">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-white shadow-[0_0_18px_rgba(22,163,74,0.35)]">
                  <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-foreground dark:text-white">Welcome Back</h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-navy-300">Sign in to your console</p>
              </div>

              <div className="mt-5">
                <AuthModeSwitch active="signin" />
              </div>

              {justRegistered && (
                <p className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-center text-sm text-emerald-700 dark:text-leaf-300">
                  Registration received! Sign in below, then verify the code emailed to you to activate your account.
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground/85 dark:text-navy-200">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-navy-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@agency.gov"
                      className="w-full rounded-xl border border-border bg-muted/60 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-navy-400 dark:focus:border-leaf-400 dark:focus:bg-white/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground/85 dark:text-navy-200">Password</label>
                  <div className="relative">
                    <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-navy-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-border bg-muted/60 py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-navy-400 dark:focus:border-leaf-400 dark:focus:bg-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:text-navy-400 dark:hover:text-navy-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-muted-foreground dark:text-navy-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                    />
                    Remember me
                  </label>
                  <a href="#" className="font-semibold text-primary hover:underline">
                    Forgot Password?
                  </a>
                </div>

                {error && <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2 text-sm text-destructive font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl disabled:opacity-60"
                >
                  {submitting ? 'Signing in…' : 'Sign In'} <ArrowRight size={15} />
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border dark:bg-white/10" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground dark:text-navy-400">Or continue with</span>
                <div className="h-px flex-1 bg-border dark:bg-white/10" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-accent dark:border-white/10 dark:bg-white/5 dark:text-navy-100 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  <GoogleIcon />
                  {oauthLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
                </button>
              </div>

              {/* 1-Click Access for All 6 Roles */}
              <div className="mt-5 border-t border-border/70 pt-4 dark:border-white/10">
                <p className="mb-2 text-center text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground dark:text-navy-400">
                  Quick Access (Preview 6 Roles)
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('super_admin');
                      navigate('/dashboard');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50/80 py-2 font-bold text-purple-900 shadow-sm transition-all hover:bg-purple-100 dark:border-purple-800/80 dark:bg-purple-950/40 dark:text-purple-300"
                  >
                    <span>🔐</span> Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('admin');
                      navigate('/dashboard');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50/80 py-2 font-bold text-indigo-900 shadow-sm transition-all hover:bg-indigo-100 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    <span>🏢</span> Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('staff');
                      navigate('/dashboard');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50/80 py-2 font-bold text-sky-900 shadow-sm transition-all hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300"
                  >
                    <span>🚒</span> Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('brgy_official');
                      navigate('/dashboard');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 py-2 font-bold text-amber-900 shadow-sm transition-all hover:bg-amber-100 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <span>⭐</span> Brgy Official
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('citizen');
                      navigate('/dashboard');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 py-2 font-bold text-emerald-900 shadow-sm transition-all hover:bg-emerald-100 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <span>🏠</span> Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('non_citizen');
                      navigate('/dashboard');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 py-2 font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                  >
                    <span>🌐</span> Non-Citizen
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground dark:text-navy-400">
                Accounts are created by an administrator in Staff Accounts.
                <br />
                Authentication is handled by Supabase Auth.
              </p>
            </div>
            </AuthFlipTransition>
          </div>

          {/* Philippine Flag Divider (Royal Blue, Sun Red, Sun Yellow) */}
          <div className="relative flex h-1.5 w-full">
            <div className="flex-1 bg-[#0038a8]" title="Peace, truth and justice" />
            <div className="flex-1 bg-[#ce1126]" title="Patriotism and valor" />
            <div className="flex-1 bg-[#fcd116]" title="Sovereignty and freedom" />
          </div>
        </section>
      </div>

      {transitioning && (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-background dark:bg-navy-950 animate-page-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-primary/40 animate-leaf-pulse text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-display text-lg font-semibold text-foreground">Welcome back</p>
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
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
