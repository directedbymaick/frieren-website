/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      transitionDuration: { DEFAULT: 'var(--duration-fast)', quick: 'var(--duration-quick)', fast: 'var(--duration-fast)', reveal: 'var(--duration-very-slow)' },
      transitionTimingFunction: { DEFAULT: 'var(--ease-smooth-out)', surface: 'var(--ease-smooth-out)' },
      transitionProperty: { interaction: 'transform, opacity, color, background-color, border-color, box-shadow, filter, width, height, margin, padding' },
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
