'use client'

import { useMemo, useState } from 'react'
import { InsightState } from '../../insight/store/urlState'
import { canAccessSnippet } from '@lib/rbac'

interface Snippet {
  name: string
  domain: 'metrics' | 'logs' | 'traces'
  query: string
  tags: string[]
  rbac?: {
    roles?: string[]
    environments?: string[]
  }
}

interface SnippetLibraryProps {
  state: InsightState
  onInsert: (query: string, domain: Snippet['domain']) => void
}

const snippets: Snippet[] = [
  {
    name: 'Checkout error budget',
    domain: 'metrics',
    query: 'sum(rate(http_requests_total{service="checkout",code=~"5.."}[5m]))',
    tags: ['latency', 'error'],
    rbac: { environments: ['production', 'staging'] }
  },
  {
    name: 'Payments slow requests',
    domain: 'logs',
    query: '{service="payments"} |= "duration" |= "slow"',
    tags: ['payments', 'latency']
  },
  {
    name: 'Trace checkout flow',
    domain: 'traces',
    query: 'traces{service="checkout"} | duration > 100ms',
    tags: ['trace', 'checkout'],
    rbac: { roles: ['sre', 'platform'] }
  }
]

export function SnippetLibrary({ state, onInsert }: SnippetLibraryProps) {
  const [filter, setFilter] = useState('')
  const accessibleSnippets = useMemo(() => {
    const normalized = filter.trim().toLowerCase()
    return snippets.filter(snippet => {
      if (!canAccessSnippet(snippet.rbac, { role: 'sre', env: state.env })) return false
      if (!normalized) return true
      return (
        snippet.name.toLowerCase().includes(normalized) ||
        snippet.query.toLowerCase().includes(normalized) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(normalized))
      )
    })
  }, [filter, state.env])

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Team snippets</h3>
        <input
          value={filter}
          onChange={event => setFilter(event.target.value)}
          placeholder="Search tags"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200"
        />
      </div>
      <div className="space-y-3">
        {accessibleSnippets.length === 0 ? (
          <p className="text-xs text-slate-500">No snippets found for the current filters.</p>
        ) : (
          accessibleSnippets.map(snippet => (
            <div key={snippet.name} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span className="font-medium">{snippet.name}</span>
                <span className="text-xs uppercase tracking-wide text-slate-500">{snippet.domain}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Tags: {snippet.tags.join(', ')}</p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900/70 p-3 text-[12px] text-slate-300">{snippet.query}</pre>
              <button
                onClick={() => onInsert(snippet.query, snippet.domain)}
                className="mt-3 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                Insert into builder
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
