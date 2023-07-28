/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
      colors: {
        lightwht: '#DADADA',
        grey: '#0f0d0d',
        purple: '#6B01B8',

      },
      fontFamily: {
        mont: ['Montserrat', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
        text: ['Source Sans 3', 'sans-serif'],
      },
    extend: {
    },
  },
  plugins: [],
}
