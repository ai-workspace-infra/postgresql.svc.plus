export const dynamic = 'error'

import MailSettings from '../../../../components/mail/MailSettings'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function MailSettingsPage({ params }: PageProps) {
  const { slug: tenantId } = await params
  return <MailSettings tenantId={tenantId} />
}
