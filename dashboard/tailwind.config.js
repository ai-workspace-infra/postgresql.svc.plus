/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#3366FF',
          light: '#4D7AFF',
          dark: '#254EDB',
          surface: '#F5F8FF',
          border: '#D6E0FF',
          navy: '#1E2E55',
          heading: '#2E3A59',
        },
        border: '#D6E0FF',
      },
      boxShadow: {
        soft: '0 35px 80px -45px rgba(37, 78, 219, 0.35), 0 25px 60px -40px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
