/**
 * Ambient animated background for the Login / Register screens: a few
 * large, slow-drifting color blobs (same technique as the Dashboard's
 * glow-drift-a/b/pulse animations) plus a handful of small embers that
 * rise and fade — a subtle nod to the fire & rescue theme. Pure CSS
 * animation, no JS ticking, so it's cheap to keep running.
 *
 * `variant="dark"` (Login's navy hero) uses brighter blobs and visible
 * embers; `variant="light"` (Register's white/light card page) keeps
 * both very low-opacity so form text stays easy to read.
 */
export function AuthBackgroundFX({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const embers = [
    { left: '8%', size: 3, delay: '0s', duration: '7s', drift: '10px' },
    { left: '18%', size: 2, delay: '1.4s', duration: '9s', drift: '-14px' },
    { left: '32%', size: 4, delay: '2.6s', duration: '8s', drift: '8px' },
    { left: '47%', size: 2, delay: '0.6s', duration: '10s', drift: '-6px' },
    { left: '61%', size: 3, delay: '3.2s', duration: '7.5s', drift: '16px' },
    { left: '74%', size: 2, delay: '1.9s', duration: '9.5s', drift: '-10px' },
    { left: '86%', size: 3, delay: '4s', duration: '8.5s', drift: '12px' },
    { left: '93%', size: 2, delay: '0.2s', duration: '11s', drift: '-8px' },
  ];

  const blobOpacity = variant === 'dark' ? '' : 'opacity-40 dark:opacity-30';
  const emberOpacity = variant === 'dark' ? 'bg-flagred-400' : 'bg-flagred-400/70';

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${blobOpacity}`}>
      {/* Drifting multi-spectral glow orbs */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-flagred-500/30 to-rose-600/20 blur-3xl animate-glow-drift-a animate-glow-pulse" />
      <div className="absolute -right-16 top-1/4 h-96 w-96 rounded-full bg-gradient-to-bl from-leaf-400/25 via-amber-500/15 to-navy-500/20 blur-3xl animate-glow-drift-b" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-gradient-to-tr from-navy-400/30 via-indigo-600/20 to-leaf-500/15 blur-3xl animate-glow-drift-c" />
      <div className="absolute -bottom-16 right-1/4 h-64 w-64 rounded-full bg-amber-500/15 blur-2xl animate-glow-drift-d" />

      {/* Rising embers */}
      {embers.map((e, i) => (
        <span
          key={i}
          className={`absolute bottom-0 rounded-full ${emberOpacity} shadow-[0_0_8px_rgba(22,163,74,0.7)] animate-ember-rise`}
          style={
            {
              left: e.left,
              width: e.size,
              height: e.size,
              animationDelay: e.delay,
              animationDuration: e.duration,
              '--ember-drift': e.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
