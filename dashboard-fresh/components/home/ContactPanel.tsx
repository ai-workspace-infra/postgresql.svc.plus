import ContactPanelClient from './ContactPanelClient'

import { getContactPanelContent } from '@cms/content'

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
