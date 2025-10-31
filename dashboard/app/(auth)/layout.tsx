import type { ReactNode } from 'react'

import { AppShellBypass } from '@lib/appShellBypass'

export default function AuthPagesLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellBypass>
      <div className="flex min-h-screen flex-col bg-slate-50">
        {children}
      </div>
    </AppShellBypass>
  )
}
