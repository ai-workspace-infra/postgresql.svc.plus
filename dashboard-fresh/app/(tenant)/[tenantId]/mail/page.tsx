export const dynamic = 'error'

import MailDashboard from '../../../components/mail/MailDashboard'

export default function TenantMailPage({ params }: { params: { tenantId: string } }) {
  const { tenantId } = params
  return <MailDashboard tenantId={tenantId} tenantName={tenantId} />
}
