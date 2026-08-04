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
        // Mint / leaf green — matches the light-theme dashboard mock
        leaf: {
          50: '#f2fbf4',
          100: '#e3f6e8',
          200: '#cdeed6',
          300: '#8ad3a1',
          400: '#4ade80',
          500: '#3fae5c',
          600: '#2f9e44',
          700: '#1f7a37',
          800: '#16612c',
          900: '#0d2416',
        },
        // Deep navy — matches the dark hero login mock
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
        ink: {
          700: '#5b7065',
          800: '#16612c',
          900: '#0d2416',
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
