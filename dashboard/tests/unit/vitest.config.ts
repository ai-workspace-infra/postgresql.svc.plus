import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '../../src/**/*.test.{ts,tsx}',
      '../../src/**/__tests__/**/*.{ts,tsx}',
      './**/*.test.{ts,tsx}',
      './**/__tests__/**/*.{ts,tsx}',
    ],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, '..', '..', 'src', 'components'),
      '@cms': path.resolve(__dirname, '..', '..', 'src', 'lib', 'cms'),
      '@i18n': path.resolve(__dirname, '..', '..', 'src', 'i18n'),
      '@lib': path.resolve(__dirname, '..', '..', 'src', 'lib'),
      '@types': path.resolve(__dirname, '..', '..', 'types'),
      '@server': path.resolve(__dirname, '..', '..', 'src', 'server'),
      '@modules': path.resolve(__dirname, '..', '..', 'src', 'modules'),
      '@extensions': path.resolve(__dirname, '..', '..', 'src', 'modules', 'extensions'),
      '@templates': path.resolve(__dirname, '..', '..', 'src', 'modules', 'templates'),
      '@theme': path.resolve(__dirname, '..', '..', 'src', 'components', 'theme'),
      '@src': path.resolve(__dirname, '..', '..', 'src'),
    },
  },
  esbuild: {
    loader: 'tsx',
    jsx: 'automatic',
  },
})
