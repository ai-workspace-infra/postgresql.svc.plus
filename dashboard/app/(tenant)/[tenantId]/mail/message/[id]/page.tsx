'use client'

import { useRouter } from 'next/navigation'

import MessageView from '../../../../../components/mail/MessageView'

export default function MessageDetailPage({ params }: { params: { tenantId: string; id: string } }) {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-4">
      <MessageView
        tenantId={params.tenantId}
        messageId={params.id}
        showBackButton
        onBack={() => router.back()}
      />
    </div>
  )
}
