'use client'

import type { ReactNode } from 'react'

import { LanguageProvider } from '@i18n/LanguageProvider'
import { UserProvider } from '@lib/userStore'
import { ThemeProvider } from '@components/theme'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <UserProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </UserProvider>
    </LanguageProvider>
  )
}
