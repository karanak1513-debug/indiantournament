/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0b0c10',
        'brand-darker': '#050507',
        'brand-accent': '#66fcf1',
        'brand-secondary': '#45a29e',
        'brand-gray': '#1f2833',
        'brand-light': '#c5c6c7',
        'neon-red': '#ff003c',
        'neon-purple': '#b026ff',
        'neon-blue': '#00d2ff',
      },
      fontFamily: {
        gaming: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
