'use client'

import { useRouter } from 'next/navigation'

import MessageView from '../../../../../components/mail/MessageView'

export default function MessageDetailPage({ params }: { params: { slug: string; id: string } }) {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-4">
      <MessageView
        tenantId={params.slug}
        messageId={params.id}
        showBackButton
        onBack={() => router.back()}
      />
    </div>
  )
}
