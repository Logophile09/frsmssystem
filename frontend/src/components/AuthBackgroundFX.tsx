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

  const isLight = variant === 'light';

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Drifting chromatic glow orbs */}
      <div
        className={`absolute -left-20 -top-20 h-80 w-80 rounded-full blur-3xl animate-glow-drift-a animate-glow-pulse ${
          isLight
            ? 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10'
            : 'bg-gradient-to-br from-emerald-500/25 to-rose-600/15'
        }`}
      />
      <div
        className={`absolute -right-16 top-1/4 h-96 w-96 rounded-full blur-3xl animate-glow-drift-b ${
          isLight
            ? 'bg-gradient-to-bl from-emerald-400/12 via-amber-400/8 to-sky-400/10'
            : 'bg-gradient-to-bl from-leaf-400/20 via-amber-500/12 to-navy-500/20'
        }`}
      />
      <div
        className={`absolute bottom-0 left-1/4 h-80 w-80 rounded-full blur-3xl animate-glow-drift-c ${
          isLight
            ? 'bg-gradient-to-tr from-sky-400/10 via-emerald-400/8 to-teal-400/10'
            : 'bg-gradient-to-tr from-navy-400/25 via-indigo-600/15 to-leaf-500/15'
        }`}
      />
      <div
        className={`absolute -bottom-16 right-1/4 h-64 w-64 rounded-full blur-2xl animate-glow-drift-d ${
          isLight ? 'bg-amber-400/8' : 'bg-amber-500/12'
        }`}
      />

      {/* Atmospheric light motes / rising embers */}
      {embers.map((e, i) => (
        <span
          key={i}
          className={`absolute bottom-0 rounded-full animate-ember-rise ${
            isLight
              ? 'bg-emerald-500/40 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
              : 'bg-emerald-400/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
          }`}
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
