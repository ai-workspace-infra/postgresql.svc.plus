export const dynamic = 'error'

import MailDashboard from '../../../components/mail/MailDashboard'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function TenantMailPage({ params }: PageProps) {
  const { slug: tenantId } = await params
  return <MailDashboard tenantId={tenantId} tenantName={tenantId} />
}
