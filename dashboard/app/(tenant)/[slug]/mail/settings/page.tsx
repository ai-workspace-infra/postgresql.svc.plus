export const dynamic = 'error'

import MailSettings from '../../../../components/mail/MailSettings'

export default function MailSettingsPage({ params }: { params: { slug: string } }) {
  return <MailSettings tenantId={params.slug} />
}
