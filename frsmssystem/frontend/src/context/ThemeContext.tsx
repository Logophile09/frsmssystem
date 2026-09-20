import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextValue {
  dark: boolean;
  /** Pass the triggering click event so the theme swap can animate as a
   * circular reveal expanding from the toggle button (design-system spec). */
  toggle: (e?: React.MouseEvent<HTMLElement>) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    // Default to light mode. Only go dark if the user has explicitly
    // chosen it before (stored in localStorage) — never follow the
    // OS/browser's prefers-color-scheme automatically.
    const stored = localStorage.getItem('frsms-theme');
    return stored === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('frsms-theme', dark ? 'dark' : 'light');
  }, [dark]);

  function toggle(e?: React.MouseEvent<HTMLElement>) {
    const next = !dark;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsViewTransitions = typeof document.startViewTransition === 'function';

    if (!e || reduceMotion || !supportsViewTransitions) {
      setDark(next);
      return;
    }

    const { clientX: x, clientY: y } = e;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(() => {
      setDark(next);
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 1150,
            easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => {
        /* animation is a progressive enhancement — theme already applied above */
      });
  }

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
