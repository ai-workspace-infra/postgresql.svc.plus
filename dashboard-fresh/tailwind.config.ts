// @deno-types="npm:@types/tailwindcss@3.4.3"
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
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
      },
    },
  },
  plugins: [typography],
} satisfies Config
