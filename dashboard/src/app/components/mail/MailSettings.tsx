'use client'

import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Loader2, Save } from 'lucide-react'

import { fetchNamespacePolicy, updateNamespacePolicy } from '@lib/mail/apiClient'
import type { NamespacePolicy } from '@lib/mail/types'

interface MailSettingsProps {
  tenantId: string
}

export default function MailSettings({ tenantId }: MailSettingsProps) {
  const namespace = useSWR<NamespacePolicy>(['mail-namespace', tenantId], () => fetchNamespacePolicy(tenantId))
  const [draft, setDraft] = useState<Partial<NamespacePolicy> | null>(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const data = useMemo(() => {
    if (!namespace.data) {
      return null
    }
    return draft ? { ...namespace.data, ...draft } : namespace.data
  }, [draft, namespace.data])

  const handleChange = useCallback((field: keyof NamespacePolicy, value: string) => {
    setDraft((prev) => ({
      ...(prev ?? {}),
      [field]: field === 'temperature' ? parseFloat(value) : field === 'maxTokens' || field === 'rateLimitPerMinute' ? Number(value) : value,
    }))
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!data) {
        return
      }
      try {
        setSaving(true)
        const updated = await updateNamespacePolicy(tenantId, draft ?? {})
        namespace.mutate(updated, false)
        setDraft(null)
        setStatus('命名空间已更新')
      } catch (error) {
        setStatus(error instanceof Error ? error.message : '更新失败')
      } finally {
        setSaving(false)
      }
    },
    [data, draft, namespace, tenantId],
  )

  if (namespace.isLoading || !data) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] p-12 text-sm text-[var(--color-text-subtle)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
        <p>正在加载租户 AI 命名空间配置…</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[var(--shadow-md)]"
    >
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-heading)]">AI 命名空间</h1>
        <p className="mt-2 text-sm text-[var(--color-text-subtle)]">
          每个租户独享模型、温度与配额设置，可审计 AI 调用轨迹并自定义敏感词策略。
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-subtle)]">模型</span>
          <input
            value={data.model}
            onChange={(event) => handleChange('model', event.target.value)}
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-subtle)]">温度</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={data.temperature}
            onChange={(event) => handleChange('temperature', event.target.value)}
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-subtle)]">最大 Token</span>
          <input
            type="number"
            value={data.maxTokens}
            onChange={(event) => handleChange('maxTokens', event.target.value)}
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-subtle)]">每分钟限流</span>
          <input
            type="number"
            value={data.rateLimitPerMinute}
            onChange={(event) => handleChange('rateLimitPerMinute', event.target.value)}
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-text-subtle)]">向量索引</span>
        <input
          value={data.vectorIndex ?? ''}
          onChange={(event) => handleChange('vectorIndex', event.target.value)}
          className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
          placeholder="s3://tenant-mail-embeddings"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-text-subtle)]">策略（敏感词、外发限制等）</span>
        <textarea
          value={data.policy ?? ''}
          onChange={(event) => handleChange('policy', event.target.value)}
          className="min-h-[160px] rounded-xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
          placeholder='{"blockedKeywords": ["secret", "NDA"]}'
        />
      </label>
      <div className="flex items-center justify-between text-xs text-[var(--color-text-subtle)]">
        <span>最近更新：{new Date(data.updatedAt).toLocaleString()}</span>
        {status ? <span>{status}</span> : null}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 保存
        </button>
      </div>
    </form>
  )
}
