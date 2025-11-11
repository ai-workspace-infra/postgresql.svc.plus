'use client'

import type { MailLabel, MailListMessage } from '@lib/mail/types'

import MessageItem from './MessageItem'

interface InboxProps {
  messages: MailListMessage[]
  selectedMessageId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  labels: MailLabel[]
}

export default function Inbox({ messages, selectedMessageId, onSelect, loading, labels }: InboxProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[color:var(--color-surface-border)] px-4 py-2 text-xs text-[var(--color-text-subtle)]">
        <span>共 {messages.length} 封邮件</span>
        <div className="flex items-center gap-2">
          {labels.slice(0, 4).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-2 py-1"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color ?? 'var(--color-primary)' }} />
              {label.name}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 px-4 py-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-xl bg-[var(--color-surface-muted)] px-3 py-4" />
            ))}
          </div>
        ) : messages.length ? (
          <ul className="divide-y divide-[color:var(--color-surface-border)]">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                active={message.id === selectedMessageId}
                onSelect={() => onSelect(message.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-[var(--color-text-subtle)]">
            <p className="text-base font-medium text-[var(--color-heading)]">收件箱为空</p>
            <p>尝试调整筛选条件或搜索关键字。</p>
          </div>
        )}
      </div>
    </div>
  )
}
