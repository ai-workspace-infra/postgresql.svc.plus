export const dynamic = 'error'

import MailDashboard from '../../../components/mail/MailDashboard'

export default function TenantMailPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  return <MailDashboard tenantId={slug} tenantName={slug} />
}
