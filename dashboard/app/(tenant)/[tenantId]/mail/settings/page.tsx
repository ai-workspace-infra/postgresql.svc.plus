export const dynamic = 'error'

import MailSettings from '../../../../components/mail/MailSettings'

type PageProps = {
  params: Promise<{
    tenantId: string
  }>
}

export default async function MailSettingsPage({ params }: PageProps) {
  const { tenantId } = await params
  return <MailSettings tenantId={tenantId} />
}
