'use client'

import { useEffect, useMemo } from 'react'
import useSWR from 'swr'

import { fetchInbox } from '@lib/mail/apiClient'
import type { MailListMessage, MailLabel, MailInboxResponse } from '@lib/mail/types'

import { useMailStore } from '../../store/mail.store'
import Inbox from './Inbox'
import MessageView from './MessageView'
import Toolbar from './Toolbar'

interface MailDashboardProps {
  tenantId: string
  tenantName: string
}

export default function MailDashboard({ tenantId, tenantName }: MailDashboardProps) {
  const { label, search, pageSize, cursor, setTenant, setSelectedMessageId, selectedMessageId } = useMailStore()

  useEffect(() => {
    setTenant(tenantId)
  }, [setTenant, tenantId])

  const inboxKey = useMemo(
    () =>
      tenantId
        ? ['mail-inbox', tenantId, label ?? 'all', search, pageSize, cursor ?? '']
        : null,
    [cursor, label, pageSize, search, tenantId],
  )

  const inbox = useSWR<MailInboxResponse>(inboxKey, () => fetchInbox(tenantId, { cursor, label, pageSize, q: search }), {
    keepPreviousData: true,
  })

  const messages: MailListMessage[] = inbox.data?.messages ?? []
  const labels: MailLabel[] = inbox.data?.labels ?? []

  useEffect(() => {
    const current = inbox.data?.messages ?? []
    if (!current.length) {
      setSelectedMessageId(null)
      return
    }

    const stillExists = current.some((message) => message.id === selectedMessageId)
    if (!stillExists) {
      setSelectedMessageId(current[0]?.id ?? null)
    }
  }, [inbox.data, selectedMessageId, setSelectedMessageId])

  return (
    <div className="grid h-[calc(100vh-280px)] gap-4 rounded-2xl lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)]">
        <Toolbar
          tenantId={tenantId}
          loading={inbox.isLoading}
          refresh={() => inbox.mutate()}
          labels={labels}
          tenantName={tenantName}
        />
        <Inbox
          loading={inbox.isLoading}
          messages={messages}
          selectedMessageId={selectedMessageId}
          onSelect={setSelectedMessageId}
          labels={labels}
        />
      </div>
      <div className="min-h-0 overflow-hidden rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)]">
        <MessageView
          tenantId={tenantId}
          messageId={selectedMessageId}
          onDeleted={() => inbox.mutate()}
          onRefreshed={() => inbox.mutate()}
        />
      </div>
    </div>
  )
}
