import type { ReactNode } from 'react'

import Footer from '@components/Footer'
import Navbar from '@components/Navbar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_70%,rgba(52,211,153,0.08),transparent_30%)]"
        aria-hidden
      />
      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 pt-[var(--app-shell-nav-offset)]">
          <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">{children}</div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
