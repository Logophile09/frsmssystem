import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') {
    return <div className="p-6 text-slate-600">You need an administrator account to view this page.</div>;
  }
  return <>{children}</>;
}
