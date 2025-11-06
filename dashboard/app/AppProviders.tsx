'use client'

import type { ReactNode } from 'react'

import { collectExtensionProviders } from '@cms/client'
import { LanguageProvider } from '@i18n/LanguageProvider'
import { UserProvider } from '@lib/userStore'
import { ThemeProvider } from '../src/theme'

const extensionProviders = collectExtensionProviders()

export function AppProviders({ children }: { children: ReactNode }) {
  let tree: ReactNode = (
    <LanguageProvider>
      <UserProvider>{children}</UserProvider>
    </LanguageProvider>
  )

  for (const Provider of extensionProviders) {
    tree = <Provider>{tree}</Provider>
  }

  return <ThemeProvider>{tree}</ThemeProvider>
}
