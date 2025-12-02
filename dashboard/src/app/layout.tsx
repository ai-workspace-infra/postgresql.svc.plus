export const dynamic = 'error'

import './globals.css'
import { AppProviders } from './AppProviders'

export const metadata = {
  title: 'Cloud-Neutral',
  description: 'Unified tools for your cloud native stack',
}

const htmlAttributes = { lang: 'en' }
const bodyClassName = 'bg-[var(--color-background)] text-[var(--color-text)]'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html {...htmlAttributes}>
      <body className={bodyClassName}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
