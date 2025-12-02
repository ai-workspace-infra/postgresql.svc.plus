'use client'

import type { ReactNode } from 'react'

import { ThemeProvider } from '@components/theme'
import { LanguageProvider } from '@i18n/LanguageProvider'
import { UserProvider } from '@lib/userStore'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>{children}</UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
