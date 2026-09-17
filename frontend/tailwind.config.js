/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Sora = display font: headings, stat numbers, card titles, logo text
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Manrope = body / UI font
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ---- Culiat Public Safety design-system tokens (CSS vars, see index.css) ----
        // CSS vars hold bare "L C H" oklch channels (no oklch(...) wrapper) so
        // Tailwind's opacity modifiers (bg-primary/10, bg-card/95, ...) work.
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        'brand-surface': {
          DEFAULT: 'oklch(var(--brand-surface) / <alpha-value>)',
          foreground: 'oklch(var(--brand-surface-foreground) / <alpha-value>)',
          muted: 'oklch(var(--brand-surface-muted) / <alpha-value>)',
        },
        footer: {
          DEFAULT: 'oklch(var(--footer) / <alpha-value>)',
          foreground: 'oklch(var(--footer-foreground) / <alpha-value>)',
          muted: 'oklch(var(--footer-muted) / <alpha-value>)',
          accent: 'oklch(var(--footer-accent) / <alpha-value>)',
        },

        // Barangay Culiat green — the ONE saturated hue in the palette.
        // Pushed a touch more vivid at every step so it reads as a distinct
        // highlight against the now-neutral navy/slate surfaces below,
        // instead of just another shade of the same green-black.
        leaf: {
          50: 'oklch(0.985 0.006 145)',
          100: 'oklch(0.955 0.02 145)',
          200: 'oklch(0.92 0.065 146)',
          300: 'oklch(0.85 0.115 148)',
          400: 'oklch(0.74 0.19 148)',
          500: 'oklch(0.6 0.175 150)',
          600: 'oklch(0.47 0.16 150)',
          700: 'oklch(0.39 0.15 150)',
          800: 'oklch(0.32 0.12 150)',
          900: 'oklch(0.24 0.09 150)',
        },
        // Deep civic surface — true neutral (near-zero chroma) so dark
        // shades read as black, not a tinted moss-green. Green lives only
        // in leaf/primary now, never in this "black" ramp.
        navy: {
          50: 'oklch(0.985 0.002 150)',
          100: 'oklch(0.955 0.003 150)',
          200: 'oklch(0.87 0.005 150)',
          300: 'oklch(0.69 0.007 150)',
          400: 'oklch(0.47 0.008 150)',
          500: 'oklch(0.36 0.009 150)',
          600: 'oklch(0.27 0.01 150)',
          700: 'oklch(0.205 0.008 150)',
          800: 'oklch(0.16 0.006 150)',
          900: 'oklch(0.115 0.004 150)',
          950: 'oklch(0.08 0.003 150)',
        },
        // Kept as an alias of leaf, per the original comment
        flagred: {
          50: 'oklch(0.985 0.006 145)',
          400: 'oklch(0.74 0.19 148)',
          500: 'oklch(0.6 0.175 150)',
          600: 'oklch(0.47 0.16 150)',
          700: 'oklch(0.39 0.15 150)',
        },
        ink: {
          700: 'oklch(0.47 0.008 150)',
          800: 'oklch(0.27 0.01 150)',
          900: 'oklch(0.18 0.006 150)',
        },
        // Plain neutral gray — chroma dropped to near-zero (was faintly
        // green-tinted) so it stays true gray at every step instead of
        // compounding the moss effect alongside navy.
        slate: {
          50: 'oklch(0.985 0.002 150)',
          100: 'oklch(0.955 0.003 150)',
          200: 'oklch(0.9 0.004 150)',
          300: 'oklch(0.82 0.005 150)',
          400: 'oklch(0.65 0.006 150)',
          500: 'oklch(0.53 0.007 150)',
          600: 'oklch(0.44 0.007 150)',
          700: 'oklch(0.36 0.007 150)',
          800: 'oklch(0.27 0.006 150)',
          900: 'oklch(0.2 0.005 150)',
          950: 'oklch(0.12 0.004 150)',
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)',
      },
      keyframes: {
        pageIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeScaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmerLeaf: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        authSlideFromRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        authSlideFromLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        authFlipFromRight: {
          '0%': { opacity: '0', transform: 'perspective(1400px) rotateY(78deg) scale(0.94)' },
          '55%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'perspective(1400px) rotateY(0deg) scale(1)' },
        },
        authFlipFromLeft: {
          '0%': { opacity: '0', transform: 'perspective(1400px) rotateY(-78deg) scale(0.94)' },
          '55%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'perspective(1400px) rotateY(0deg) scale(1)' },
        },
        glowDriftA: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(45px, 35px) scale(1.15)' },
        },
        glowDriftB: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-40px, -30px) scale(1.18)' },
        },
        glowDriftC: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1.05)' },
          '50%': { transform: 'translate(30px, -35px) scale(0.92)' },
        },
        glowDriftD: {
          '0%, 100%': { transform: 'translate(0, 0) scale(0.95)' },
          '50%': { transform: 'translate(-25px, 40px) scale(1.12)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.75' },
        },
        glowPulseSlow: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.5' },
        },
        glowSpinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        emberRise: {
          '0%': { transform: 'translate(0, 0) scale(0.6)', opacity: '0' },
          '12%': { opacity: '0.9' },
          '80%': { opacity: '0.5' },
          '100%': { transform: 'translate(var(--ember-drift, 12px), -180px) scale(1)', opacity: '0' },
        },
      },
      animation: {
        'page-in': 'pageIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'modal-in': 'fadeScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'leaf-pulse': 'shimmerLeaf 2.4s ease-in-out infinite',
        'auth-slide-from-right': 'authSlideFromRight 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'auth-slide-from-left': 'authSlideFromLeft 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        'auth-flip-from-right': 'authFlipFromRight 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
        'auth-flip-from-left': 'authFlipFromLeft 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow-drift-a': 'glowDriftA 16s ease-in-out infinite',
        'glow-drift-b': 'glowDriftB 20s ease-in-out infinite',
        'glow-drift-c': 'glowDriftC 22s ease-in-out infinite',
        'glow-drift-d': 'glowDriftD 18s ease-in-out infinite',
        'glow-pulse': 'glowPulse 7s ease-in-out infinite',
        'glow-pulse-slow': 'glowPulseSlow 10s ease-in-out infinite',
        'glow-spin-slow': 'glowSpinSlow 45s linear infinite',
        'ember-rise': 'emberRise linear infinite',
      },
      boxShadow: {
        'glow-leaf': '0 0 35px -5px rgba(22, 163, 74, 0.25)',
        'glow-amber': '0 0 35px -5px rgba(245, 158, 11, 0.22)',
        'glow-navy': '0 0 35px -5px rgba(59, 130, 246, 0.2)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
