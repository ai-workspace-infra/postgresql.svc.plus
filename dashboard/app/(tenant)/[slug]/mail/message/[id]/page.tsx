'use client'

import { useRouter } from 'next/navigation'

import MessageView from '../../../../../components/mail/MessageView'

export default function MessageDetailPage({ params }: { params: { slug: string; id: string } }) {
  const router = useRouter()
  const tenantId = params.slug
  return (
    <div className="flex flex-col gap-4">
      <MessageView
        tenantId={tenantId}
        messageId={params.id}
        showBackButton
        onBack={() => router.back()}
      />
    </div>
  )
}
