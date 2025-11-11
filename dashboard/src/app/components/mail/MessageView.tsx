'use client'

import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, FileDown, Loader2, Reply, Sparkles, Trash2 } from 'lucide-react'

import {
  classifyMessage,
  deleteMessage,
  fetchMessage,
  suggestReplies,
  summarizeMessage,
} from '@lib/mail/apiClient'
import type { MailMessageDetail } from '@lib/mail/types'

interface MessageViewProps {
  tenantId: string
  messageId: string | null
  onDeleted?: () => void
  onRefreshed?: () => void
  showBackButton?: boolean
  onBack?: () => void
}

function formatAddress(address: { name?: string; email: string }) {
  if (address.name && address.name.trim()) {
    return `${address.name} <${address.email}>`
  }
  return address.email
}

function renderHtml(content?: string) {
  if (!content) {
    return null
  }
  return { __html: content }
}

export default function MessageView({ tenantId, messageId, onDeleted, onRefreshed, showBackButton, onBack }: MessageViewProps) {
  const [aiBusy, setAiBusy] = useState(false)
  const message = useSWR<MailMessageDetail>(
    messageId ? ['mail-message', tenantId, messageId] : null,
    () => fetchMessage(tenantId, messageId!),
  )

  const handleSummarize = useCallback(async () => {
    if (!messageId) {
      return
    }
    try {
      setAiBusy(true)
      const summary = await summarizeMessage(tenantId, { messageId })
      message.mutate((prev) => (prev ? { ...prev, aiInsights: summary } : prev), false)
      onRefreshed?.()
    } finally {
      setAiBusy(false)
    }
  }, [message, messageId, onRefreshed, tenantId])

  const handleSuggestReplies = useCallback(async () => {
    if (!messageId) {
      return
    }
    try {
      setAiBusy(true)
      const { suggestions } = await suggestReplies(tenantId, { messageId, style: 'concise', language: 'zh' })
      message.mutate((prev) =>
        prev
          ? {
              ...prev,
              aiInsights: {
                ...(prev.aiInsights ?? { summary: '', bullets: [], actions: [], tone: '' }),
                suggestions,
              },
            }
          : prev,
        false,
      )
      onRefreshed?.()
    } finally {
      setAiBusy(false)
    }
  }, [message, messageId, onRefreshed, tenantId])

  const handleDelete = useCallback(async () => {
    if (!messageId) {
      return
    }
    await deleteMessage(tenantId, messageId)
    message.mutate(undefined, false)
    onDeleted?.()
  }, [message, messageId, onDeleted, tenantId])

  const handleClassify = useCallback(async () => {
    if (!messageId) {
      return
    }
    try {
      setAiBusy(true)
      const classification = await classifyMessage(tenantId, messageId)
      message.mutate((prev) =>
        prev
          ? {
              ...prev,
              labels: Array.from(new Set([...(prev.labels ?? []), ...classification.labels])),
            }
          : prev,
        false,
      )
      onRefreshed?.()
    } finally {
      setAiBusy(false)
    }
  }, [message, messageId, onRefreshed, tenantId])

  const insights = message.data?.aiInsights

  const header = useMemo(() => {
    if (!message.data) {
      return null
    }
    return (
      <div className="flex flex-col gap-2 border-b border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center rounded-full border border-[color:var(--color-surface-border)] px-3 py-1 text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-primary)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> 返回
              </button>
            ) : null}
            <h2 className="text-lg font-semibold text-[var(--color-heading)]">{message.data.subject}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-subtle)]">
            <button
              type="button"
              onClick={handleSummarize}
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-primary-border)] px-3 py-1 text-[var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
              disabled={aiBusy}
            >
              {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} 摘要
            </button>
            <button
              type="button"
              onClick={handleSuggestReplies}
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-surface-border)] px-3 py-1 hover:border-[color:var(--color-primary-border)]"
              disabled={aiBusy}
            >
              <Reply className="h-3.5 w-3.5" /> 智能回复
            </button>
            <button
              type="button"
              onClick={handleClassify}
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-surface-border)] px-3 py-1 hover:border-[color:var(--color-primary-border)]"
              disabled={aiBusy}
            >
              <Sparkles className="h-3.5 w-3.5" /> 分类
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-danger-muted)] px-3 py-1 text-[var(--color-danger-foreground)] hover:bg-[var(--color-danger-muted)]"
            >
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-sm text-[var(--color-text-subtle)]">
          <span>
            来自：<strong className="text-[var(--color-heading)]">{formatAddress(message.data.from)}</strong>
          </span>
          <span>发送时间：{new Date(message.data.date).toLocaleString()}</span>
          <span>
            收件人：{message.data.to.map((recipient) => formatAddress(recipient)).join(', ')}
          </span>
          {message.data.cc?.length ? (
            <span>抄送：{message.data.cc.map((recipient) => formatAddress(recipient)).join(', ')}</span>
          ) : null}
        </div>
      </div>
    )
  }, [aiBusy, handleClassify, handleDelete, handleSummarize, handleSuggestReplies, message.data, onBack, showBackButton])

  if (!messageId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center text-sm text-[var(--color-text-subtle)]">
        <Sparkles className="h-8 w-8 text-[var(--color-primary)]" />
        <p className="text-base font-medium text-[var(--color-heading)]">选择左侧邮件以查看详情</p>
        <p>AI 摘要、智能回复与行动项将在此处展示。</p>
      </div>
    )
  }

  if (message.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-12 text-center text-sm text-[var(--color-text-subtle)]">
        <p className="text-base font-semibold text-[var(--color-heading)]">无法加载邮件</p>
        <p>{message.error instanceof Error ? message.error.message : 'Unknown error'}</p>
      </div>
    )
  }

  if (!message.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center text-sm text-[var(--color-text-subtle)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
        <p>正在加载邮件内容…</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {header}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {insights ? (
          <div className="space-y-3 rounded-xl border border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] px-4 py-3 text-sm text-[var(--color-text)]">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold text-[var(--color-primary)]">AI 摘要</p>
              {insights.tone ? <span className="text-xs text-[var(--color-text-subtle)]">语气：{insights.tone}</span> : null}
            </div>
            <p className="text-sm leading-relaxed">{insights.summary}</p>
            {insights.bullets.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {insights.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {insights.actions.length ? (
              <div>
                <p className="text-xs font-semibold text-[var(--color-heading)]">建议行动</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {insights.actions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {insights.suggestions?.length ? (
              <div className="rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2 text-xs text-[var(--color-text-subtle)]">
                <p className="font-semibold text-[var(--color-heading)]">回复建议</p>
                <ul className="mt-1 space-y-1">
                  {insights.suggestions.map((suggestion, index) => (
                    <li key={index} className="rounded-md bg-[var(--color-surface-muted)] px-2 py-1 text-[var(--color-text)]">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        <article className="prose prose-sm mt-6 max-w-none text-[var(--color-text)] prose-headings:text-[var(--color-heading)]">
          {message.data.html ? (
            <div dangerouslySetInnerHTML={renderHtml(message.data.html) ?? undefined} />
          ) : (
            <pre className="whitespace-pre-wrap rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)]">
              {message.data.text ?? message.data.snippet}
            </pre>
          )}
        </article>
        {message.data.attachments?.length ? (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--color-heading)]">附件</h3>
            <ul className="space-y-2 text-sm">
              {message.data.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg border border-[color:var(--color-surface-border)] px-3 py-2 text-[var(--color-text-subtle)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-heading)]">{attachment.fileName}</p>
                    <p className="text-xs">{attachment.contentType}</p>
                  </div>
                  {attachment.downloadUrl ? (
                    <a
                      href={attachment.downloadUrl}
                      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-primary-border)] px-3 py-1 text-xs text-[var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
                    >
                      <FileDown className="h-3.5 w-3.5" /> 下载
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
