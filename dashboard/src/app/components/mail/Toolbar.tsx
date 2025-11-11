'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Filter, Loader2, MailPlus, RefreshCw, Search } from 'lucide-react'

import { useMailStore } from '../../store/mail.store'
import type { MailLabel } from '@lib/mail/types'

interface ToolbarProps {
  tenantId: string
  tenantName: string
  loading?: boolean
  refresh: () => void
  labels: MailLabel[]
}

const PRESET_FILTERS: Array<{ id: string | null; label: string }> = [
  { id: null, label: '全部' },
  { id: 'unread', label: '未读' },
  { id: 'starred', label: '星标' },
  { id: 'important', label: '重要' },
]

export default function Toolbar({ tenantId, tenantName, loading, refresh, labels }: ToolbarProps) {
  const { label, setLabel, search, setSearch } = useMailStore()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col gap-3 border-b border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-subtle)]">
          <Filter className="h-4 w-4" />
          <span>{tenantName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-surface-border)] px-3 py-1.5 text-sm text-[var(--color-text-subtle)] transition hover:border-[color:var(--color-primary-border)] hover:text-[var(--color-primary)]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            刷新
          </button>
          <Link
            href={`/panel/mail/compose?tenantId=${tenantId}`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-primary-hover)]"
          >
            <MailPlus className="h-4 w-4" /> 写邮件
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_FILTERS.map((filter) => (
          <button
            key={filter.id ?? 'all'}
            type="button"
            onClick={() => setLabel(filter.id)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs transition ${
              label === filter.id
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)] hover:text-[var(--color-primary)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs text-[var(--color-text-subtle)] transition hover:text-[var(--color-primary)]"
        >
          <Filter className="h-3 w-3" /> 更多
        </button>
      </div>
      {expanded ? (
        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-subtle)]">
          {labels.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLabel(item.id)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 transition ${
                label === item.id
                  ? 'border-[color:var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                  : 'border-[color:var(--color-surface-border)] hover:border-[color:var(--color-primary-border)]'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color ?? 'var(--color-primary)' }}
              />
              {item.name}
              {typeof item.unread === 'number' ? <span>({item.unread})</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-sm text-[var(--color-text-subtle)]">
        <Search className="h-4 w-4" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索发件人、主题或内容"
          className="flex-1 bg-transparent text-sm text-[var(--color-text)] focus:outline-none"
        />
      </div>
    </div>
  )
}
