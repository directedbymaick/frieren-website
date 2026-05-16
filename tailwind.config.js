/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        ivory: 'var(--ivory)',
        gold: 'var(--gold)',
        sage: 'var(--sage)',
        plum: 'var(--plum)',
      },
      fontFamily: {
        serif: ['Fraunces', '"Cormorant Garamond"', '"EB Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
