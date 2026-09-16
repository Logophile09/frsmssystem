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

        // Barangay Culiat green — primary accent. Recolored to the civic-green
        // OKLCH ramp from DESIGN-SYSTEM-PROMPT.md so every existing leaf-* class
        // across the app inherits the new brand color with no per-file edits.
        leaf: {
          50: 'oklch(0.985 0.009 145)',
          100: 'oklch(0.955 0.015 145)',
          200: 'oklch(0.925 0.055 145)',
          300: 'oklch(0.86 0.09 148)',
          400: 'oklch(0.76 0.155 148)',
          500: 'oklch(0.6 0.15 150)',
          600: 'oklch(0.47 0.145 150)',
          700: 'oklch(0.4 0.14 150)',
          800: 'oklch(0.32 0.11 150)',
          900: 'oklch(0.24 0.08 150)',
        },
        // Deep civic surface — recolored to the dark-mode background/card ramp
        navy: {
          50: 'oklch(0.985 0.009 145)',
          100: 'oklch(0.955 0.015 145)',
          200: 'oklch(0.87 0.03 145)',
          300: 'oklch(0.69 0.025 150)',
          400: 'oklch(0.47 0.025 155)',
          500: 'oklch(0.36 0.028 152)',
          600: 'oklch(0.27 0.035 152)',
          700: 'oklch(0.215 0.028 152)',
          800: 'oklch(0.185 0.025 152)',
          900: 'oklch(0.155 0.022 152)',
          950: 'oklch(0.115 0.018 152)',
        },
        // Kept as an alias of leaf, per the original comment
        flagred: {
          50: 'oklch(0.985 0.009 145)',
          400: 'oklch(0.76 0.155 148)',
          500: 'oklch(0.6 0.15 150)',
          600: 'oklch(0.47 0.145 150)',
          700: 'oklch(0.4 0.14 150)',
        },
        ink: {
          700: 'oklch(0.47 0.025 155)',
          800: 'oklch(0.27 0.035 152)',
          900: 'oklch(0.18 0.025 150)',
        },
        // Neutral gray recolored with a faint civic-green tint (hue ~150) to
        // match the design system's foreground/border/muted family, instead
        // of plain neutral slate.
        slate: {
          50: 'oklch(0.985 0.008 150)',
          100: 'oklch(0.955 0.012 150)',
          200: 'oklch(0.9 0.016 150)',
          300: 'oklch(0.82 0.02 150)',
          400: 'oklch(0.65 0.022 152)',
          500: 'oklch(0.53 0.024 152)',
          600: 'oklch(0.44 0.026 152)',
          700: 'oklch(0.36 0.026 152)',
          800: 'oklch(0.27 0.026 152)',
          900: 'oklch(0.2 0.025 150)',
          950: 'oklch(0.145 0.022 150)',
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
