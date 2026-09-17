import { Navigate } from 'react-router-dom';
import { Clock3, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AmbientGlow from '../components/AmbientGlow';

export default function PendingApproval() {
  const { session, profile, loading, demoMode, signOut } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!session && !demoMode) return <Navigate to="/login" replace />;
  if (profile?.status && profile.status !== 'pending') return <Navigate to="/dashboard" replace />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-foreground px-6 transition-colors duration-300">
      <AmbientGlow position="fixed" variant="auth" showEmbers interactive />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-navy-950/85">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary shadow-[0_0_18px_rgba(22,163,74,0.35)]">
          <Clock3 size={26} />
        </div>

        <h1 className="mt-5 font-display text-xl font-bold text-foreground dark:text-white">Awaiting Approval</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-navy-200">
          Thanks for registering{profile?.full_name ? `, ${profile.full_name}` : ''}. Your account has been
          created but needs to be reviewed by a Barangay Culiat FRSMS administrator before you can sign in.
        </p>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border bg-muted/60 p-3 text-left text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-navy-200">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>This review step keeps access to incident and personnel data restricted to verified responders and staff.</span>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/60 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-accent dark:border-white/10 dark:bg-white/5 dark:text-navy-100 dark:hover:bg-white/10"
        >
          <LogOut size={15} /> Sign Out
        </button>

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground dark:text-navy-400">
          Questions about your account? Contact your station administrator, or call the office directly.
        </p>
      </div>
    </div>
  );
}
