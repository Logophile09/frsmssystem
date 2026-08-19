import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Radio, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

// Dark-glass input/label styling — matches the sign-in card on Login.tsx
// exactly, so the two auth screens read as one continuous experience.
const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-navy-400 focus:border-leaf-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-leaf-400/20';
const labelClass = 'mb-1.5 block text-xs font-semibold text-navy-200';

export default function Register() {
  const { session, demoMode, profile, loading } = useAuth();
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
        // Already signed in via Google -- no need to sign in again, the
        // account is just 'pending' until an admin approves it.
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

      // Auto-sign-in so the app has a session; the account is 'pending'
      // so every protected route will bounce them to /pending-approval.
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
      <div className="flex min-h-screen items-center justify-center bg-navy-900 text-sm text-navy-300">
        Loading your account…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="animate-page-in">
        {/* Navbar — identical to Login so Sign In / Register are always reachable */}
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
              <Link
                to="/login"
                className="hidden items-center gap-2 rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:border-leaf-400/50 hover:bg-white/10 sm:flex"
              >
                <UserRound size={15} /> Sign In
              </Link>
              <span className="flex items-center gap-2 rounded-lg border border-leaf-400/50 bg-leaf-400/10 px-4 py-2 text-sm font-semibold text-leaf-300">
                <UserPlus size={15} /> Register
              </span>
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

        {/* Dark hero panel — same station-photo + gradient + drifting glow
            treatment as Login, so the form card sits in an identical scene. */}
        <section className="relative overflow-hidden bg-navy-900 py-14 sm:py-20">
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
          <AuthBackgroundFX variant="dark" />

          <div className="relative mx-auto w-full max-w-2xl px-6">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-leaf-400 bg-white shadow-[0_0_18px_rgba(206,17,38,0.35)]">
                <img src="/barangay-culiat-seal.png" alt="Barangay Culiat seal" className="h-full w-full object-cover" />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-leaf-300">Barangay Culiat &middot; Quezon City</p>
              <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                {oauthCompletion ? 'Complete Your Registration' : 'FRSMS Staff Registration'}
              </h1>
              <p className="mt-2 max-w-md text-sm text-navy-200">
                {oauthCompletion
                  ? "You're signed in with Google -- just a few more details and an administrator will review your account."
                  : 'Register for access as a responder or staff member. An administrator will review and approve your account before you can sign in.'}
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
              className="rounded-2xl border border-white/10 bg-navy-950/90 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-9"
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
                {oauthCompletion && <p className="mt-1 text-[11px] text-navy-400">Linked to your Google account.</p>}
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
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-navy-200">
                Terms<span className="text-flagred-400">*</span>
              </label>
              <label className="flex items-start gap-2.5 text-sm text-navy-200">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-flagred-500 focus:ring-flagred-400"
                />
                <span>
                  I agree to the{' '}
                  <a href="#" className="font-medium text-leaf-300 hover:text-leaf-200">
                    terms and conditions
                  </a>
                  .
                </span>
              </label>
            </div>

            {error && <p className="rounded-lg bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-flagred-500 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-flagred-500/25 transition-colors duration-300 hover:bg-flagred-600 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : oauthCompletion ? 'Complete Registration' : 'Register'} <ArrowRight size={15} />
            </button>

            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-navy-200">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-leaf-300" />
              <span>Your account will be held for administrator approval before you can sign in and access FRSMS.</span>
            </div>
          </div>
            </form>
            </AuthFlipTransition>
          </div>

          {/* Flag-colored divider — same sign-off as Login's hero section */}
          <div className="relative flex h-1.5 w-full">
            <div className="flex-1 bg-navy-500" />
            <div className="flex-1 bg-flagred-500" />
            <div className="flex-1 bg-leaf-400" />
          </div>
        </section>
      </div>
    </div>
  );
}

// Small "signed in as ... via Google" pill shown instead of the Sign
// in/Register toggle when completing an OAuth registration -- with an
// escape hatch in case they authenticated with the wrong Google account.
function OAuthSignedInBadge({ email }: { email: string | null }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function switchAccount() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-navy-200">
      <span className="truncate">
        Signed in as <span className="font-semibold text-white">{email ?? 'your Google account'}</span>
      </span>
      <button type="button" onClick={switchAccount} className="shrink-0 font-semibold text-leaf-300 hover:text-leaf-200">
        Not you?
      </button>
    </div>
  );
}
