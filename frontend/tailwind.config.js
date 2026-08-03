/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Cinzel', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        leaf: {
          50: '#f1faf3',
          100: '#dcf3e2',
          200: '#b7e6c4',
          300: '#8ad3a1',
          400: '#5cbd80',
          500: '#3fa367',
          600: '#2f8352',
          700: '#276843',
          800: '#215137',
          900: '#1b402d',
        },
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
          950: '#060a12',
        },
        ink: {
          800: '#0f1a2b',
          900: '#0a121e',
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
