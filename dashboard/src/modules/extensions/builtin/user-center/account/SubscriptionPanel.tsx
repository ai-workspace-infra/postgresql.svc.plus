'use client'

import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'

import Card from '../components/Card'

const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  }).then((res) => res.json())

type SubscriptionRecord = {
  id: string
  provider: string
  kind?: string
  planId?: string
  status: string
  externalId: string
  createdAt?: string
  updatedAt?: string
  cancelledAt?: string
  meta?: Record<string, unknown>
}

type SubscriptionResponse = {
  subscriptions?: SubscriptionRecord[]
  error?: string
  message?: string
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export default function SubscriptionPanel() {
  const { data, isLoading, mutate } = useSWR<SubscriptionResponse>('/api/auth/subscriptions', fetcher)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const records = useMemo(() => data?.subscriptions ?? [], [data?.subscriptions])

  const handleCancel = useCallback(
    async (externalId: string) => {
      if (!externalId) return
      setSubmitting(externalId)
      setError(null)
      try {
        const response = await fetch('/api/auth/subscriptions/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ externalId }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          setError((payload?.message as string) || '取消订阅失败，请稍后重试。')
          return
        }

        await mutate()
      } catch (err) {
        console.warn('Failed to cancel subscription', err)
        setError('取消订阅时发生错误。')
      } finally {
        setSubmitting(null)
      }
    },
    [mutate],
  )

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-heading)]">订阅与计费</h2>
          <p className="text-sm text-[var(--color-text-subtle)]">查看你通过 PayPal 触发的 Pay-as-you-go 与 SaaS 订阅。</p>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {isLoading ? (
        <p className="mt-4 text-sm text-[var(--color-text-subtle)]">加载订阅中…</p>
      ) : records.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-text-subtle)]">暂无订阅记录。</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)] p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-primary)]">{record.provider}</p>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">{record.kind ?? 'subscription'}</h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${record.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
                >
                  {record.status}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-sm text-[var(--color-text-subtle)]">
                <div className="flex items-center justify-between">
                  <dt>Plan</dt>
                  <dd className="font-medium text-[var(--color-text)]">{record.planId || '—'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>External ID</dt>
                  <dd className="break-all text-[var(--color-text)]">{record.externalId}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Created</dt>
                  <dd className="text-[var(--color-text)]">{formatDate(record.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Updated</dt>
                  <dd className="text-[var(--color-text)]">{formatDate(record.updatedAt)}</dd>
                </div>
                {record.cancelledAt ? (
                  <div className="flex items-center justify-between">
                    <dt>Cancelled</dt>
                    <dd className="text-[var(--color-text)]">{formatDate(record.cancelledAt)}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCancel(record.externalId)}
                  disabled={record.status === 'cancelled' || submitting === record.externalId}
                  className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-surface-border)] px-4 py-2 text-sm font-medium text-[color:var(--color-danger-foreground)] transition-colors hover:border-[color:var(--color-danger-border)] hover:text-[color:var(--color-danger-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {record.status === 'cancelled' ? '已取消' : submitting === record.externalId ? '处理中…' : '停止订阅'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
