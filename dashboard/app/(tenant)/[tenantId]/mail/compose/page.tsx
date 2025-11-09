export const dynamic = 'error'

import ComposeForm from '../../../../components/mail/ComposeForm'

type PageProps = {
  params: Promise<{
    tenantId: string
  }>
}

export default async function ComposePage({ params }: PageProps) {
  const { tenantId } = await params
  return <ComposeForm tenantId={tenantId} />
}
