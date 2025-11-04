'use client'

import { TraceSpan } from '../../insight/services/adapters/traces'

interface TracesTopStatsProps {
  spans: TraceSpan[]
}

export function TracesTopStats({ spans }: TracesTopStatsProps) {
  if (!spans.length) {
    return <p className="text-sm text-slate-400">Run a TraceQL query to surface top spans and bottlenecks.</p>
  }

  const longestSpan = spans.reduce((prev, current) => (current.durationMs > prev.durationMs ? current : prev), spans[0])
  const averageDuration = spans.reduce((sum, span) => sum + span.durationMs, 0) / spans.length

  const serviceDurations = spans.reduce<Record<string, number>>((acc, span) => {
    acc[span.service] = (acc[span.service] ?? 0) + span.durationMs
    return acc
  }, {})
  const [heaviestService, heaviestDuration] = Object.entries(serviceDurations).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner">
        <p className="text-xs uppercase tracking-wide text-slate-500">Longest span</p>
        <p className="mt-1 text-xl font-semibold text-slate-100">{longestSpan.name}</p>
        <p className="text-xs text-slate-500">{longestSpan.durationMs.toFixed(1)} ms</p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner">
        <p className="text-xs uppercase tracking-wide text-slate-500">Average duration</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-300">{averageDuration.toFixed(1)} ms</p>
        <p className="text-xs text-slate-500">Across {spans.length} spans</p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner">
        <p className="text-xs uppercase tracking-wide text-slate-500">Heaviest service</p>
        <p className="mt-1 text-xl font-semibold text-slate-100">{heaviestService ?? 'unknown'}</p>
        <p className="text-xs text-slate-500">{(heaviestDuration ?? 0).toFixed(1)} ms total</p>
      </div>
    </div>
  )
}
