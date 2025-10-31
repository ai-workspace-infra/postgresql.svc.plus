export const dynamic = 'force-dynamic'

export const revalidate = 0

import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { isFeatureEnabled } from '@lib/featureToggles'

import RegisterContent from './RegisterContent'

function RegisterPageFallback() {
  return <div className="flex min-h-screen flex-col bg-slate-50" />
}

export default function RegisterPage() {
  if (!isFeatureEnabled('globalNavigation', '/register')) {
    notFound()
  }

  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterContent />
    </Suspense>
  )
}
