export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { isFeatureEnabled } from '@lib/featureToggles'

import EmailVerificationContent from './EmailVerificationContent'

function EmailVerificationPageFallback() {
  return <div className="flex min-h-screen flex-col bg-slate-50" />
}

export default function EmailVerificationPage() {
  if (!isFeatureEnabled('globalNavigation', '/email-verification')) {
    notFound()
  }

  return (
    <Suspense fallback={<EmailVerificationPageFallback />}>
      <EmailVerificationContent />
    </Suspense>
  )
}
