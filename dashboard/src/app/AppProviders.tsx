'use client'

import type { ReactNode } from 'react'

import { ThemeProvider } from '@components/theme'
import { LanguageProvider } from '@i18n/LanguageProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  )
}
