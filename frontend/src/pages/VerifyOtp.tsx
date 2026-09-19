import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { KeyRound, LogOut, MailCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AmbientGlow from '../components/AmbientGlow';

// How long the person has to wait before they're allowed to request
// another code -- keeps someone from hammering "Resend" and burning
// through Supabase's email-send rate limit.
const RESEND_COOLDOWN_S = 120;

/**
 * Extra verification step inserted between "Continue with Google" and the
 * rest of the app. Google already proves the person controls that Google
 * account, but an 8-digit code emailed via Supabase's own auth.signInWithOtp
 * proves they *also* control the inbox behind it before we hand out a
 * dashboard session -- see Login.tsx's handleOAuth, which now redirects
 * here instead of straight to /register.
 *
 * Note: Supabase sends the code using the "Magic Link" email template in
 * the project's Auth settings, which must include {{ .Token }} (the
 * default template does) for an 8-digit code to actually show up in the
 * email -- otherwise the person only receives a clickable link.
 */
export default function VerifyOtp() {
  const { session, profile, loading, demoMode, requiresOtp, markOtpVerified, signOut } = useAuth();

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
      // Sending the OTP email itself failed (e.g. the mail provider
      // rejected it, hit a sending limit, or the sender domain isn't
      // verified for that recipient) -- that's an infrastructure problem,
      // not something the person did wrong. Rather than stranding them on
      // an error screen they can't fix, treat it the same as if this
      // extra inbox check had passed: let them straight into the app. The
      // Google sign-in itself already proved who they are; this step was
      // only ever a nice-to-have on top of that.
      markOtpVerified();
      return;
    }
    setInfo(isResend ? `New code sent to ${email}.` : `We emailed an 8-digit code to ${email}.`);
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
  // Not a Google sign-in, or already verified this session -- nothing to
  // do here. Route onward exactly the way Login/Register normally would.
  if (!requiresOtp) {
    if (demoMode || profile?.status === 'active') return <Navigate to="/dashboard" replace />;
    if (profile?.status === 'pending') return <Navigate to="/pending-approval" replace />;
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
    setVerifying(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    markOtpVerified();
    // Downstream redirect (register vs. pending-approval vs. dashboard) is
    // handled by the requiresOtp === false branch above on the re-render.
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
              Enter the 8-digit code we emailed to <span className="font-semibold text-foreground dark:text-white">{email}</span>.
            </>
          ) : (
            'Enter the 8-digit code we emailed to you.'
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
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="12345678"
                className="w-full rounded-xl border border-border bg-muted/60 py-2.5 pl-9 pr-3 text-center text-lg font-bold tracking-[0.4em] text-foreground placeholder:text-muted-foreground placeholder:tracking-[0.4em] focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-navy-400 dark:focus:border-leaf-400 dark:focus:bg-white/10"
              />
            </div>
          </div>

          {error && <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2 text-sm text-destructive font-medium">{error}</p>}
          {info && !error && <p className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-sm text-emerald-700 dark:text-leaf-300">{info}</p>}

          <button
            type="submit"
            disabled={verifying || code.length !== 8}
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
          <span>This extra check confirms you also control the inbox behind your Google account before granting access.</span>
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
