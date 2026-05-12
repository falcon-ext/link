/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#8DC63F',
          'green-dark': '#6FA02E',
          'green-light': '#A8D960',
          dark: '#1A1D1C',
          'dark-2': '#242827',
          'dark-3': '#2E3330',
        },
      },
    },
  },
  plugins: [],
};
