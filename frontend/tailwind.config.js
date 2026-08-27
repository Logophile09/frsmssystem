/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Barangay Culiat green — primary accent, matches the official
        // barangayculiat.com portal's nav highlights & CTA buttons
        leaf: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf0cd',
          300: '#86e0ac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#0a2e18',
        },
        // Deep navy — matches the dark hero / navbar mock
        navy: {
          50: '#eef1f6',
          100: '#d3dae7',
          200: '#a6b6cf',
          300: '#71889f',
          400: '#3f597a',
          500: '#26405e',
          600: '#1b3049',
          700: '#14243a',
          800: '#0f1a2b',
          900: '#0a121e',
          950: '#050d12',
        },
        // Barangay Culiat green — hotline bars, emergency CTAs (alias of leaf, kept for landing page clarity)
        flagred: {
          50: '#f0fdf4',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
        ink: {
          700: '#4b5563',
          800: '#1e293b',
          900: '#0f1a2b',
        },
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
