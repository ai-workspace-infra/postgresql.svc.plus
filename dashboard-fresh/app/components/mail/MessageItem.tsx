'use client'

import { MailOpen, Star, StarOff } from 'lucide-react'

import type { MailListMessage } from '@lib/mail/types'

interface MessageItemProps {
  message: MailListMessage
  active?: boolean
  onSelect: () => void
}

function formatAddress(address: { name?: string; email: string }) {
  if (address.name && address.name.trim().length > 0) {
    return `${address.name} <${address.email}>`
  }
  return address.email
}

function formatDate(input: string) {
  const date = new Date(input)
  return date.toLocaleString()
}

export default function MessageItem({ message, active, onSelect }: MessageItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[var(--color-surface-hover)] ${
          active ? 'bg-[var(--color-primary-muted)]' : ''
        }`}
      >
        <span
          className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
            message.unread
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)]'
          }`}
        >
          {message.unread ? '新' : <MailOpen className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`truncate text-sm font-semibold ${message.unread ? 'text-[var(--color-heading)]' : ''}`}>
              {formatAddress(message.from)}
            </p>
            {message.labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] uppercase text-[var(--color-text-subtle)]"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="mt-1 truncate text-sm text-[var(--color-heading)]">{message.subject}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-subtle)]">{message.snippet}</p>
          {message.aiSummary?.preview ? (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-accent)]">AI：{message.aiSummary.preview}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-[var(--color-text-subtle)]">
          <span>{formatDate(message.date)}</span>
          <span className="text-[var(--color-text-subtle)]">
            {message.hasAttachments ? '📎' : null}
          </span>
          <span className="text-[var(--color-warning-foreground)]">
            {message.aiSummary?.tone}
          </span>
        </div>
        <div className="pl-2">
          {message.starred ? <Star className="h-4 w-4 text-yellow-400" /> : <StarOff className="h-4 w-4 text-[var(--color-text-subtle)]" />}
        </div>
      </button>
    </li>
  )
}
