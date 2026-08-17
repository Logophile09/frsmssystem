import { Navigate } from 'react-router-dom';
import { Clock3, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PendingApproval() {
  const { session, profile, loading, demoMode, signOut } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!session && !demoMode) return <Navigate to="/login" replace />;
  if (profile?.status && profile.status !== 'pending') return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-950/90 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-leaf-400 bg-white/5 shadow-[0_0_18px_rgba(206,17,38,0.35)]">
          <Clock3 size={26} className="text-leaf-400" />
        </div>

        <h1 className="mt-5 font-display text-xl font-bold text-white">Awaiting Approval</h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-200">
          Thanks for registering{profile?.full_name ? `, ${profile.full_name}` : ''}. Your account has been
          created but needs to be reviewed by a Barangay Culiat FRSMS administrator before you can sign in.
        </p>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-left text-xs text-navy-200">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-leaf-400" />
          <span>This review step keeps access to incident and personnel data restricted to verified responders and staff.</span>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-navy-100 transition-colors duration-300 hover:border-leaf-400/30 hover:bg-white/10"
        >
          <LogOut size={15} /> Sign Out
        </button>

        <p className="mt-5 text-[11px] leading-relaxed text-navy-400">
          Questions about your account? Contact your station administrator, or call the office directly.
        </p>
      </div>
    </div>
  );
}
