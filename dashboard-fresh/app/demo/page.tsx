export const dynamic = 'error'

import { notFound } from 'next/navigation'

import { isFeatureEnabled } from '@lib/featureToggles'
import DemoContent from './DemoContent'

export default function DemoPage() {
  if (!isFeatureEnabled('appModules', '/demo')) {
    notFound()
  }

  return <DemoContent />
}
