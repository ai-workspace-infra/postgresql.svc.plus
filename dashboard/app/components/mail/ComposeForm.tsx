'use client'

import { FormEvent, useCallback, useMemo, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { sendMessage } from '@lib/mail/apiClient'
import type { ComposePayload } from '@lib/mail/types'

interface ComposeFormProps {
  tenantId: string
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export default function ComposeForm({ tenantId }: ComposeFormProps) {
  const router = useRouter()
  const params = useSearchParams()
  const replySubject = params.get('subject') ?? ''
  const replyTo = params.get('to') ?? ''
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<ComposePayload>({
    to: replyTo ? parseList(replyTo) : [],
    cc: [],
    bcc: [],
    subject: replySubject,
    text: '',
    html: '',
    attachments: [],
  })
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (form.to.length === 0) {
        setStatus('至少填写一个收件人')
        return
      }
      try {
        setSubmitting(true)
        await sendMessage(tenantId, form)
        setStatus('已成功发送！')
        setTimeout(() => {
          router.push(`/panel/mail?tenantId=${tenantId}`)
        }, 600)
      } catch (error) {
        setStatus(error instanceof Error ? error.message : '发送失败')
      } finally {
        setSubmitting(false)
      }
    },
    [form, router, tenantId],
  )

  const handleFieldChange = useCallback(
    (field: keyof ComposePayload, value: string | string[]) => {
      setForm((prev) => ({
        ...prev,
        [field]: Array.isArray(value) ? value : value,
      }))
    },
    [],
  )

  const recipientsPreview = useMemo(() => form.to.join(', '), [form.to])

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-md)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--color-heading)]">写信</h1>
        <p className="text-sm text-[var(--color-text-subtle)]">通过 TLS-only 通道发送邮件，附件将使用 S3 预签名直传。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-subtle)]">收件人</span>
          <input
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
            value={recipientsPreview}
            placeholder="user@example.com, second@example.com"
            onChange={(event) => handleFieldChange('to', parseList(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-subtle)]">抄送</span>
          <input
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
            placeholder="可选"
            onChange={(event) => handleFieldChange('cc', parseList(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-subtle)]">密送</span>
          <input
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
            placeholder="可选"
            onChange={(event) => handleFieldChange('bcc', parseList(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-subtle)]">主题</span>
          <input
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
            value={form.subject}
            onChange={(event) => handleFieldChange('subject', event.target.value)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-text-subtle)]">正文</span>
        <textarea
          className="min-h-[200px] rounded-xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
          value={form.text}
          onChange={(event) => handleFieldChange('text', event.target.value)}
          placeholder="请在此输入邮件内容，可使用 Markdown。"
        />
      </label>
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-4 py-6 text-center text-sm text-[var(--color-text-subtle)]">
        <p className="font-medium text-[var(--color-heading)]">附件上传</p>
        <p>需要上传大附件时，将调用后端预签名接口后直传至 S3。</p>
      </div>
      {status ? <p className="text-sm text-[var(--color-text-subtle)]">{status}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} 发送
        </button>
      </div>
    </form>
  )
}
