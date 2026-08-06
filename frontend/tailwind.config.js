/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'Times', 'serif'],
        sans: ['Georgia', 'Times New Roman', 'Times', 'serif'],
      },
      colors: {
        // Gold / amber — Bagong Pilipinas accent, matches the official seal & hero mock
        leaf: {
          50: '#fffaf0',
          100: '#fdf0d3',
          200: '#fbe0a3',
          300: '#f7cc66',
          400: '#f0b52e',
          500: '#e0a017',
          600: '#c07f0d',
          700: '#96600c',
          800: '#6e4710',
          900: '#3a2408',
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
        // Republic red — hotline bars, emergency CTAs
        flagred: {
          50: '#fdf0f0',
          400: '#e14b4b',
          500: '#ce1126',
          600: '#a90d1f',
          700: '#830a18',
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
      },
      animation: {
        'page-in': 'pageIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'modal-in': 'fadeScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'leaf-pulse': 'shimmerLeaf 2.4s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
