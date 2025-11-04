export const dynamic = 'error'

import { Fragment } from 'react'

import './globals.css'
import { applyExtensionLayouts, getActiveTheme } from '@cms'
import { AppProviders } from './AppProviders'

export const metadata = {
  title: 'CloudNative Suite',
  description: 'Unified tools for your cloud native stack',
}

const theme = getActiveTheme()
const ThemeProvider = theme.Provider ?? Fragment
const htmlAttributes = theme.htmlAttributes ?? { lang: 'en' }
const bodyClassName = theme.bodyClassName ?? 'bg-[var(--color-background)] text-[var(--color-text)]'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = applyExtensionLayouts(children)

  return (
    <html {...htmlAttributes}>
      <body className={bodyClassName}>
        <ThemeProvider>
          <AppProviders>{content}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
