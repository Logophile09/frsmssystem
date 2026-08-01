/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ember: {
          50: '#fff4ed',
          100: '#ffe4d3',
          400: '#ff8a4c',
          500: '#f8641f',
          600: '#e04c10',
          700: '#b8380f',
          900: '#7a2410',
        },
        ink: {
          800: '#1c2230',
          900: '#12161f',
        },
      },
      keyframes: {
        pageIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'page-in': 'pageIn 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
