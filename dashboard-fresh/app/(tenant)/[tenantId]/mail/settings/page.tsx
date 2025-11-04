export const dynamic = 'error'

import MailSettings from '../../../../components/mail/MailSettings'

export default function MailSettingsPage({ params }: { params: { tenantId: string } }) {
  return <MailSettings tenantId={params.tenantId} />
}
