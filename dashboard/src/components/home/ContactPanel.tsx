import ContactPanelClient from './ContactPanelClient'

import { getContactPanelContent } from '@lib/marketingContent'

type ContactPanelProps = {
  className?: string
}

export default async function ContactPanel({ className }: ContactPanelProps = {}) {
  const panel = await getContactPanelContent()

  if (!panel || !panel.items.length) {
    return null
  }

  return <ContactPanelClient panel={panel} className={className} />
}
