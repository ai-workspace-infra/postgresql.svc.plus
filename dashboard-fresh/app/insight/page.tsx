import { notFound } from 'next/navigation'

import InsightWorkbench from './InsightWorkbench'
import { isFeatureEnabled } from '@lib/featureToggles'

export default function InsightPage() {
  if (!isFeatureEnabled('appModules', '/insight')) {
    notFound()
  }

  return <InsightWorkbench />
}
