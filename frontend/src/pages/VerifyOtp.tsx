import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { KeyRound, LogOut, MailCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { verifyRegistrationOtp } from '../lib/api';
import AmbientGlow from '../components/AmbientGlow';

// How long the person has to wait before they're allowed to request
// another code -- keeps someone from hammering "Resend" and burning
// through Supabase's email-send rate limit.
const RESEND_COOLDOWN_S = 30;

/**
 * The account-verification step every 'pending' account goes through --
 * this replaced the old admin-approval step (Staff Accounts used to have
 * to flip status: pending -> active by hand). A 6-digit code emailed via
 * Supabase's own auth.signInWithOtp proves the person controls the inbox
 * behind the account before we activate it and hand out a dashboard
 * session. Reached two ways:
 *  - Email/password self-registration (Register.tsx) already collected
 *    every FRSMS-specific field up front, so verifying here activates the
 *    account immediately (see handleVerify below).
 *  - "Continue with Google" (Login.tsx's handleOAuth) redirects here
 *    before /register, since Google proves an identity but not control of
 *    that account's inbox; that sign-in's profile is still missing the
 *    position/station/phone fields, so verifying here sends it on to
 *    /register to collect those, and /complete-oauth activates it once
 *    they're filled in.
 *
 * Note: Supabase sends the code using the "Magic Link" email template in
 * the project's Auth settings, which must include {{ .Token }} (the
 * default template does) for a 6-digit code to actually show up in the
 * email -- otherwise the person only receives a clickable link.
 */
export default function VerifyOtp() {
  const { session, profile, loading, demoMode, requiresOtp, markOtpVerified, refreshProfile, signOut } = useAuth();

  const email = session?.user.email ?? null;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sentRef = useRef(false);

  async function sendCode(isResend: boolean) {
    if (!email) return;
    setSending(true);
    setError(null);
    // shouldCreateUser: false -- this account already exists (it was just
    // created/signed-in via Google); we only want Supabase to email a
    // fresh OTP for it, never to spin up a brand-new user here.
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setSending(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setInfo(isResend ? `New code sent to ${email}.` : `We emailed a 6-digit code to ${email}.`);
    setCooldown(RESEND_COOLDOWN_S);
  }

  // Auto-send the first code once, as soon as we know who to send it to.
  useEffect(() => {
    if (!requiresOtp || !email || sentRef.current) return;
    sentRef.current = true;
    sendCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresOtp, email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!session && !demoMode) return <Navigate to="/login" replace />;
  // Already verified (or never needed to be, e.g. an admin-created
  // account) -- nothing to do here. Route onward exactly the way
  // Login/Register normally would.
  if (!requiresOtp) {
    if (demoMode || profile?.status === 'active') return <Navigate to="/dashboard" replace />;
    if (profile?.status === 'disabled') return <Navigate to="/dashboard" replace />;
    // The only remaining case once OTP is cleared: a Google sign-in still
    // missing the position/station/phone fields the registration form
    // collects. (A fully-filled-in profile never lingers here 'pending' --
    // handleVerify below activates it in the same step that clears OTP.)
    return <Navigate to="/register" replace />;
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setVerifying(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    });
    if (verifyError) {
      setVerifying(false);
      setError(verifyError.message);
      return;
    }

    // A self-registered (email/password) account already has its
    // position/station/phone filled in from the registration form -- this
    // code is the last gate before the dashboard, so activate the account
    // right away. A fresh Google sign-in's profile is still missing those
    // fields (profile.position is unset); leave it 'pending' for now and
    // let the redirect below send it to /register to finish them --
    // /complete-oauth activates it once they're filled in, since this OTP
    // already proved control of the inbox.
    if (profile?.position) {
      try {
        await verifyRegistrationOtp();
      } catch (err: any) {
        setVerifying(false);
        setError(err.message ?? 'Could not activate your account. Please try again.');
        return;
      }
    }

    // Only mark OTP as cleared once activation (when needed) has actually
    // succeeded -- otherwise a failed activation call above would still
    // bounce the person onward past a screen that could retry it.
    markOtpVerified();
    await refreshProfile();
    setVerifying(false);
    // Downstream redirect (register vs. dashboard) is handled by the
    // requiresOtp === false branch above on the re-render.
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-foreground px-6 transition-colors duration-300">
      <AmbientGlow position="fixed" variant="auth" showEmbers interactive />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-navy-950/85">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary shadow-[0_0_18px_rgba(22,163,74,0.35)]">
          <MailCheck size={26} />
        </div>

        <h1 className="mt-5 font-display text-xl font-bold text-foreground dark:text-white">Verify Your Email</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-navy-200">
          {email ? (
            <>
              Enter the 6-digit code we emailed to <span className="font-semibold text-foreground dark:text-white">{email}</span>.
            </>
          ) : (
            'Enter the 6-digit code we emailed to you.'
          )}
        </p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4 text-left">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground/85 dark:text-navy-200">Verification Code</label>
            <div className="relative">
              <KeyRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-navy-400" />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-xl border border-border bg-muted/60 py-2.5 pl-9 pr-3 text-center text-lg font-bold tracking-[0.4em] text-foreground placeholder:text-muted-foreground placeholder:tracking-[0.4em] focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-navy-400 dark:focus:border-leaf-400 dark:focus:bg-white/10"
              />
            </div>
          </div>

          {error && <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2 text-sm text-destructive font-medium">{error}</p>}
          {info && !error && <p className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-sm text-emerald-700 dark:text-leaf-300">{info}</p>}

          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl disabled:opacity-60"
          >
            {verifying ? 'Verifying…' : 'Verify & Continue'}
          </button>

          <button
            type="button"
            onClick={() => sendCode(true)}
            disabled={sending || cooldown > 0}
            className="w-full text-center text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : sending ? 'Sending…' : "Didn't get a code? Resend"}
          </button>
        </form>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border bg-muted/60 p-3 text-left text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-navy-200">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>This confirms you control the inbox behind your account and activates it -- no separate approval step needed.</span>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/60 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-accent dark:border-white/10 dark:bg-white/5 dark:text-navy-100 dark:hover:bg-white/10"
        >
          <LogOut size={15} /> Cancel & Sign Out
        </button>
      </div>
    </div>
  );
}
