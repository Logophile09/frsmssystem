import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, profile, loading, demoMode } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!session && !demoMode) return <Navigate to="/login" replace />;
  if (!demoMode && profile?.status === 'pending') return <Navigate to="/pending-approval" replace />;
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
