import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Radio, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { registerAccount } from '../lib/api';
import { AuthModeSwitch, AuthFlipTransition } from '../components/AuthModeSwitch';
import { AuthBackgroundFX } from '../components/AuthBackgroundFX';

// Same navbar links as Login — Register isn't the home route, so these
// point back to the landing page's sections via the `/#id` pattern.
const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#ai', label: 'AI Technology' },
  { href: '/#modules', label: 'Modules' },
  { href: '/#about', label: 'About' },
];

// Dark-glass input/label styling — matches the sign-in card on Login.tsx
// exactly, so the two auth screens read as one continuous experience.
const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-navy-400 focus:border-leaf-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-leaf-400/20';
const labelClass = 'mb-1.5 block text-xs font-semibold text-navy-200';

export default function Register() {
  const { session, demoMode } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    position: '',
    station: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    notes: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session || demoMode) return <Navigate to="/dashboard" replace />;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreed) return setError('You must agree to the terms and conditions to register.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm_password) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await registerAccount({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        position: form.position,
        station: form.station,
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
                FRSMS Staff Registration
              </h1>
              <p className="mt-2 max-w-md text-sm text-navy-200">
                Register for access as a responder or staff member. An administrator will review and approve your
                account before you can sign in.
              </p>
              <div className="mt-5 w-full max-w-xs">
                <AuthModeSwitch active="register" />
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
                <input
                  required
                  value={form.position}
                  onChange={(e) => set('position', e.target.value)}
                  placeholder="e.g. Firefighter I, EMT"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Station / Unit</label>
                <input
                  required
                  value={form.station}
                  onChange={(e) => set('station', e.target.value)}
                  placeholder="e.g. Culiat Fire Sub-Station"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@agency.gov"
                  className={inputClass}
                />
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
              {submitting ? 'Submitting…' : 'Register'} <ArrowRight size={15} />
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
