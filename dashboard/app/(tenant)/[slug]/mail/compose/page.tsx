export const dynamic = 'error'

import ComposeForm from '../../../../components/mail/ComposeForm'

export default function ComposePage({ params }: { params: { slug: string } }) {
  return <ComposeForm tenantId={params.slug} />
}
