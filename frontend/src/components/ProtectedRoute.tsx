import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, profile, loading, demoMode, requiresOtp, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!session && !demoMode) return <Navigate to="/login" replace />;
  // A pending account (e.g. a stale /dashboard bookmark) landed here before
  // clearing the emailed OTP step -- send them to finish that first.
  if (requiresOtp) return <Navigate to="/verify-otp" replace />;
  // OTP is cleared but the account is still 'pending' -- the only way that
  // happens now is a Google sign-in still missing the position/station/
  // phone fields the registration form collects (there's no separate
  // admin-approval step to wait on anymore).
  if (!demoMode && profile?.status === 'pending') return <Navigate to="/register" replace />;
  if (!demoMode && profile?.status === 'disabled') {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-6 text-foreground transition-colors duration-300">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-navy-950/90">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary shadow-[0_0_18px_rgba(22,163,74,0.35)]">
            <ShieldOff size={26} />
          </div>

          <h1 className="mt-5 font-display text-xl font-bold text-foreground dark:text-white">Account Disabled</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-navy-200">
            An administrator has disabled access to this account. If you believe this is a mistake, reach out to
            your FRSMS administrator to have it reactivated.
          </p>

          <button
            type="button"
            onClick={async () => {
              // A disabled account still has a live Supabase session sitting in
              // storage -- without this, a stale /dashboard bookmark (or just
              // hitting back) drops the person right back on this same screen
              // instead of ever reaching /login.
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl"
          >
            <ArrowLeft size={15} /> Back to Login
          </button>
        </div>
      </div>
    );
  }
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || (profile?.role as string) === 'super admin';
  if (adminOnly && !isAdmin) {
    return <div className="p-6 text-slate-600">You need an administrator account to view this page.</div>;
  }
  return <>{children}</>;
}
