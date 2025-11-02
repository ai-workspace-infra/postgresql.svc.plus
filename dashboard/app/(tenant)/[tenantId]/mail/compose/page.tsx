export const dynamic = 'error'

import ComposeForm from '../../../../components/mail/ComposeForm'

export default function ComposePage({ params }: { params: { tenantId: string } }) {
  return <ComposeForm tenantId={params.tenantId} />
}
