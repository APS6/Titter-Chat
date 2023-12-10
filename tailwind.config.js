/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      mont: ['Montserrat', 'sans-serif'],
      raleway: ['Raleway', 'sans-serif'],
      text: ['Source Sans 3', 'sans-serif'],
    },
    extend: {
      colors: {
        lightwht: '#b3b3b3',
        grey: '#181818',
        purple: '#7228bd',

      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
}
