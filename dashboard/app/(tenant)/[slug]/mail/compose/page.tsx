export const dynamic = 'error'

import ComposeForm from '../../../../components/mail/ComposeForm'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function ComposePage({ params }: PageProps) {
  const { slug: tenantId } = await params
  return <ComposeForm tenantId={tenantId} />
}
