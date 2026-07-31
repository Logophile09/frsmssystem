/** @type {import('tailwindcss').Config} */
export default {
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
    },
  },
  plugins: [],
};
