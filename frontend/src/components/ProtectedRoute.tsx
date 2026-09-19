import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, profile, loading, demoMode, requiresOtp } = useAuth();

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
      <div className="flex h-screen items-center justify-center px-6 text-center text-slate-600">
        This account has been disabled. Contact an administrator if you believe this is a mistake.
      </div>
    );
  }
  if (adminOnly && profile?.role !== 'admin') {
    return <div className="p-6 text-slate-600">You need an administrator account to view this page.</div>;
  }
  return <>{children}</>;
}
