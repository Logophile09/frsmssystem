import React, { useEffect, useRef } from 'react';

export interface AmbientGlowProps {
  className?: string;
  position?: 'fixed' | 'absolute';
  variant?: 'system' | 'intense' | 'subtle' | 'auth';
  showEmbers?: boolean;
  interactive?: boolean;
}

/**
 * System-Wide Ambient Background Glow
 *
 * A multi-layered, GPU-accelerated atmospheric lighting engine featuring:
 * 1. Multi-orbital drifting chromatic orbs (Emergency Red, Electric Navy, Amber, Cyan)
 * 2. Wide-spectrum diffused radial bloom (blur-3xl / 100-140px falloff)
 * 3. Smooth interactive cursor spotlight (gentle reactive aura following mouse movement)
 * 4. Micro floating fire embers / light motes for atmospheric life
 * 5. Hardware-accelerated CSS keyframe animations (zero main-thread rendering overhead)
 *
 * Tuned for visual elegance across both Light Mode (soft frosted sunset tones)
 * and Dark Mode (deep cyber-ops command center glow).
 */
export default function AmbientGlow({
  className = '',
  position = 'fixed',
  variant = 'system',
  showEmbers = true,
  interactive = true,
}: AmbientGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth mouse-follow spotlight
  useEffect(() => {
    if (!interactive) return;

    let frameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const x = `${(e.clientX / window.innerWidth) * 100}%`;
        const y = `${(e.clientY / window.innerHeight) * 100}%`;
        containerRef.current.style.setProperty('--mouse-x', x);
        containerRef.current.style.setProperty('--mouse-y', y);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [interactive]);

  const embers = [
    { left: '6%', size: 3, delay: '0s', duration: '9s', drift: '18px' },
    { left: '16%', size: 2, delay: '2.5s', duration: '12s', drift: '-16px' },
    { left: '28%', size: 3.5, delay: '4.2s', duration: '10s', drift: '14px' },
    { left: '44%', size: 2, delay: '1.2s', duration: '13s', drift: '-12px' },
    { left: '58%', size: 3, delay: '5.1s', duration: '11s', drift: '20px' },
    { left: '72%', size: 2.5, delay: '3.3s', duration: '12.5s', drift: '-15px' },
    { left: '85%', size: 3, delay: '6.4s', duration: '10.5s', drift: '12px' },
    { left: '94%', size: 2, delay: '0.8s', duration: '14s', drift: '-10px' },
  ];

  const posClass = position === 'fixed' ? 'fixed inset-0 -z-10' : 'absolute inset-0 -z-10';

  // Variant opacities
  const opacityConfig = {
    system: 'opacity-100 dark:opacity-100',
    intense: 'opacity-125 dark:opacity-125',
    subtle: 'opacity-60 dark:opacity-60',
    auth: 'opacity-100 dark:opacity-100',
  }[variant];

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden ${posClass} ${opacityConfig} ${className}`}
      style={
        {
          '--mouse-x': '50%',
          '--mouse-y': '25%',
        } as React.CSSProperties
      }
    >
      {/* 1. Primary Emergency Flame/Ruby Orb (Top-Left quadrant) */}
      <div className="absolute -left-20 -top-28 h-[34rem] w-[34rem] rounded-full bg-gradient-to-br from-leaf-400/30 via-flagred-500/25 to-rose-500/10 blur-[100px] animate-glow-drift-a animate-glow-pulse dark:from-leaf-500/28 dark:via-flagred-600/20 dark:to-rose-900/15" />

      {/* 2. Deep Electric Navy / Cyber Indigo Orb (Right-Center quadrant) */}
      <div className="absolute -right-24 top-1/4 h-[38rem] w-[38rem] rounded-full bg-gradient-to-bl from-navy-400/25 via-blue-600/20 to-indigo-600/15 blur-[120px] animate-glow-drift-b dark:from-navy-400/35 dark:via-blue-500/20 dark:to-indigo-500/25" />

      {/* 3. Warm Rescue Fire Amber Orb (Bottom-Left / Center) */}
      <div className="absolute bottom-[-10%] left-[20%] h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-leaf-400/10 blur-[100px] animate-glow-drift-c dark:from-amber-600/20 dark:via-orange-600/15 dark:to-leaf-500/15" />

      {/* 4. High-Tech Emergency Cyan / Aqua Accent Beacon (Bottom-Right quadrant) */}
      <div className="absolute -bottom-24 -right-16 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tl from-cyan-500/15 via-sky-600/12 to-navy-500/15 blur-[90px] animate-glow-drift-d dark:from-cyan-400/18 dark:via-sky-500/15 dark:to-navy-400/20" />

      {/* 5. Center Diffused Radial Bloom (Atmospheric Wash) */}
      <div className="absolute left-1/2 top-1/3 h-[45rem] w-[45rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial from-leaf-400/10 via-amber-400/5 to-transparent blur-[140px] animate-glow-pulse-slow dark:from-leaf-500/12 dark:via-blue-600/6 dark:to-transparent" />

      {/* 6. Smooth Mouse-Follow Spotlight Aura */}
      {interactive && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background:
              'radial-gradient(650px circle at var(--mouse-x, 50%) var(--mouse-y, 25%), rgba(22, 163, 74, 0.075), rgba(59, 130, 246, 0.04) 35%, transparent 70%)',
          }}
        />
      )}

      {/* 7. Subtle Floating Ember Particles */}
      {showEmbers && (
        <div className="absolute inset-0 opacity-70 dark:opacity-85">
          {embers.map((e, i) => (
            <span
              key={i}
              className="absolute bottom-0 rounded-full bg-gradient-to-t from-flagred-500 to-amber-400 shadow-[0_0_8px_rgba(206,17,38,0.8)] animate-ember-rise"
              style={
                {
                  left: e.left,
                  width: `${e.size}px`,
                  height: `${e.size}px`,
                  animationDelay: e.delay,
                  animationDuration: e.duration,
                  '--ember-drift': e.drift,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
