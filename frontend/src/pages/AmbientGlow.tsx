/**
 * Shared ambient background glow — soft, slow-drifting color blobs that sit
 * behind page content (pure CSS animation via the glow-drift-a/b + glow-pulse
 * keyframes, so it's cheap to keep running everywhere).
 *
 * This is the same visual language as AuthBackgroundFX (used on the Landing
 * hero, Login, and Register) so the effect carries through the whole
 * journey — landing page -> sign in -> dashboard -> every other screen in
 * the app — instead of stopping once someone logs in. Layout renders this
 * once behind <Outlet />, so every authenticated page gets it automatically
 * without needing its own copy.
 *
 * Deliberately lighter than AuthBackgroundFX (no embers, lower opacity):
 * authenticated pages are dense with white/dark cards and tables, so the
 * glow should read as ambient texture, not compete with content.
 */
export default function AmbientGlow({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-flagred-400/30 blur-3xl animate-glow-drift-a dark:bg-flagred-500/25" />
      <div className="absolute -right-20 top-1/4 h-[32rem] w-[32rem] rounded-full bg-navy-400/25 blur-3xl animate-glow-drift-b dark:bg-navy-400/30" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-leaf-400/20 blur-3xl animate-glow-drift-a dark:bg-leaf-500/20" />
      <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-flagred-300/15 blur-3xl animate-glow-drift-b dark:bg-flagred-400/15" />
    </div>
  );
}
