import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Radio, ShieldCheck, UserPlus, UserRound, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { registerAccount, completeOAuthRegistration } from '../lib/api';
import { AuthModeSwitch, AuthFlipTransition } from '../components/AuthModeSwitch';
import { AuthBackgroundFX } from '../components/AuthBackgroundFX';
import Select from '../components/Select';

// Same navbar links as Login — Register isn't the home route, so these
// point back to the landing page's sections via the `/#id` pattern.
const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#ai', label: 'AI Technology' },
  { href: '/#modules', label: 'Modules' },
  { href: '/#about', label: 'About' },
];

// Fixed choices instead of free text -- keeps the values consistent with
// what Personnel/Staff Accounts expect, and avoids typos ("Fire Officer 1"
// vs "Fire Officer I" vs "FO1") turning into inconsistent records down the
// line. "Other" reveals a follow-up text input, same pattern as the
// Location field on the Incidents page.
const OTHER = 'Other (specify below)';
const POSITION_OPTIONS = [
  'Fire Officer 1',
  'Fire Officer 2',
  'Fire Officer 3',
  'Senior Fire Officer',
  'Station Chief',
  'Fire Inspector',
  'EMT',
  'Paramedic',
  'Dispatcher',
  'Administrative Staff',
  'Volunteer Responder',
  OTHER,
];
const STATION_OPTIONS = [
  'Culiat Fire Sub-Station',
  'BFP Quezon City – District 6',
  'Tandang Sora Fire Sub-Station',
  'Rescue QC – Culiat Unit',
  OTHER,
];

// Dual-theme adaptive input and label styling
const inputClass =
  'w-full rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-navy-400 dark:focus:border-leaf-400 dark:focus:bg-white/10';
const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground/85 dark:text-navy-200';

export default function Register() {
  const { session, demoMode, profile, loading, refreshProfile } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  // A session with no *approved* profile yet means "Continue with Google"
  // brought them here (see Login.tsx's handleOAuth redirectTo) -- they're
  // already authenticated, just missing the position/station/phone fields
  // the email/password form below collects. Show a shorter completion
  // form instead of asking them to invent a password for an account they
  // already signed into with Google.
  const oauthCompletion = !loading && Boolean(session) && !demoMode && profile?.status !== 'active';

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    position: '',
    position_other: '',
    station: '',
    station_other: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    notes: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Prefill name/email from the Google account once, the first time we
  // detect an OAuth session -- still fully editable afterward.
  useEffect(() => {
    if (!oauthCompletion || prefilled || !session) return;
    const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = [meta.full_name, meta.name].find((v): v is string => typeof v === 'string' && v.trim().length > 0);
    const [first, ...rest] = (fullName ?? '').trim().split(/\s+/);
    setForm((f) => ({
      ...f,
      first_name: first ?? f.first_name,
      last_name: rest.join(' ') || f.last_name,
      email: session.user.email ?? f.email,
    }));
    setPrefilled(true);
  }, [oauthCompletion, prefilled, session]);

  if (demoMode) return <Navigate to="/dashboard" replace />;
  if (!loading && profile?.status === 'active') return <Navigate to="/dashboard" replace />;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreed) return setError('You must agree to the terms and conditions to register.');
    const position = form.position === OTHER ? form.position_other.trim() : form.position;
    const station = form.station === OTHER ? form.station_other.trim() : form.station;
    if (!position) return setError('Please select (or specify) a position / rank.');
    if (!station) return setError('Please select (or specify) a station / unit.');

    if (!oauthCompletion) {
      if (form.password.length < 8) return setError('Password must be at least 8 characters.');
      if (form.password !== form.confirm_password) return setError('Passwords do not match.');
    }

    setSubmitting(true);
    try {
      if (oauthCompletion) {
        await completeOAuthRegistration({
          full_name: `${form.first_name} ${form.last_name}`.trim(),
          phone: form.phone,
          position,
          station,
          notes: form.notes,
        });
        // Already signed in via Google. The account stays 'pending' until
        // an administrator approves it -- refresh the profile (it's still
        // the bare-bones one AuthContext loaded at sign-in) and send them
        // to the waiting screen; ProtectedRoute would bounce them there
        // anyway, but navigating explicitly avoids a flash of /dashboard.
        await refreshProfile();
        navigate('/pending-approval', { replace: true });
        return;
      }

      await registerAccount({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        position,
        station,
        notes: form.notes,
      });

      // Auto-sign-in so the app has a session and can show the waiting
      // screen right away -- the account itself stays 'pending' until an
      // administrator approves it from Staff Accounts.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) {
        navigate('/login', {
          replace: true,
          state: { registered: true },
        });
      } else {
        navigate('/pending-approval', { replace: true });
      }
    } catch (err: any) {
      setError(err.message ?? 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // A session exists but we don't know its status yet (profile still
  // loading) -- wait rather than briefly flashing the full password-based
  // signup form at someone who just finished signing in with Google.
  if (loading && session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading your account…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="animate-page-in">
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
              <Link
                to="/login"
                className="hidden items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors duration-300 hover:border-primary/40 hover:bg-accent sm:flex"
              >
                <UserRound size={15} /> Sign In
              </Link>
              <span className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <UserPlus size={15} /> Register
              </span>
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

        {/* Hero panel with dual-theme background */}
        <section className="relative overflow-hidden bg-slate-50/70 transition-colors duration-500 dark:bg-navy-950 py-14 sm:py-20">
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

          <div className="relative mx-auto w-full max-w-2xl px-6">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-white shadow-[0_0_18px_rgba(22,163,74,0.35)]">
                <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-primary dark:text-leaf-300">Barangay Culiat &middot; Quezon City</p>
              <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-foreground dark:text-white sm:text-4xl">
                {oauthCompletion ? 'Complete Your Registration' : 'FRSMS Staff Registration'}
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground dark:text-navy-200">
                {oauthCompletion
                  ? "You're signed in with Google -- just a few more details and you're in."
                  : 'Register for access as a responder or staff member. Your account is ready to use as soon as you sign up.'}
              </p>
              <div className="mt-5 w-full max-w-xs">
                {oauthCompletion ? (
                  <OAuthSignedInBadge email={session?.user.email ?? null} />
                ) : (
                  <AuthModeSwitch active="register" />
                )}
              </div>
            </div>

            <AuthFlipTransition>
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card/95 p-7 shadow-2xl backdrop-blur-xl transition-colors duration-300 sm:p-9 dark:border-white/10 dark:bg-navy-950/90"
            >
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  value={form.first_name}
                  onChange={(e) => set('first_name', e.target.value)}
                  placeholder="First"
                  className={inputClass}
                />
                <input
                  required
                  value={form.last_name}
                  onChange={(e) => set('last_name', e.target.value)}
                  placeholder="Last"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Position / Rank</label>
                <Select
                  required
                  value={form.position}
                  onChange={(v) => set('position', v)}
                  options={POSITION_OPTIONS}
                  placeholder="Select position / rank…"
                />
                {form.position === OTHER && (
                  <input
                    required
                    value={form.position_other}
                    onChange={(e) => set('position_other', e.target.value)}
                    placeholder="Specify position / rank"
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>
              <div>
                <label className={labelClass}>Station / Unit</label>
                <Select
                  required
                  value={form.station}
                  onChange={(v) => set('station', v)}
                  options={STATION_OPTIONS}
                  placeholder="Select station / unit…"
                />
                {form.station === OTHER && (
                  <input
                    required
                    value={form.station_other}
                    onChange={(e) => set('station_other', e.target.value)}
                    placeholder="Specify station / unit"
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  required
                  type="email"
                  disabled={oauthCompletion}
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@agency.gov"
                  className={`${inputClass} ${oauthCompletion ? 'opacity-60' : ''}`}
                />
                {oauthCompletion && <p className="mt-1 text-[11px] text-muted-foreground dark:text-navy-400">Linked to your Google account.</p>}
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="### ### ####"
                  className={inputClass}
                />
              </div>
            </div>

            {!oauthCompletion && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Password</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input
                    required
                    type="password"
                    value={form.confirm_password}
                    onChange={(e) => set('confirm_password', e.target.value)}
                    placeholder="Re-enter password"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>
                Certifications, availability, or anything else we should know. If none, leave as N/A.
              </label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="N/A"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground/85 dark:text-navy-200">
                Terms<span className="text-destructive">*</span>
              </label>
              <label className="flex items-start gap-2.5 text-sm text-foreground/85 dark:text-navy-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  I agree to the{' '}
                  <a href="#" className="font-semibold text-primary hover:underline">
                    terms and conditions
                  </a>
                  .
                </span>
              </label>
            </div>

            {error && <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-sm text-destructive font-medium">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : oauthCompletion ? 'Complete Registration' : 'Register'} <ArrowRight size={15} />
            </button>

            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/60 p-3 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-navy-200">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>You'll be signed in and taken straight to the FRSMS dashboard.</span>
            </div>
          </div>
            </form>
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
    </div>
  );
}

// Small "signed in as ... via Google" pill shown instead of the Sign
// in/Register toggle when completing an OAuth registration
function OAuthSignedInBadge({ email }: { email: string | null }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function switchAccount() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-full border border-border bg-card/80 px-4 py-2 text-xs text-foreground backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-navy-200">
      <span className="truncate">
        Signed in as <span className="font-semibold text-foreground dark:text-white">{email ?? 'your Google account'}</span>
      </span>
      <button type="button" onClick={switchAccount} className="shrink-0 font-semibold text-primary hover:underline">
        Not you?
      </button>
    </div>
  );
}
