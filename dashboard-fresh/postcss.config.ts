// PostCSS configuration for Deno
// @deno-types="npm:@types/postcss@8.4.32"
import type { ProcessOptions } from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
  ],
} satisfies ProcessOptions
