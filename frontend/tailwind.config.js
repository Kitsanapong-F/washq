/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#8B5A2B',
          dark: '#724822',
          light: '#A0522D',
        }
      }
    },
  },
  plugins: [],
}
