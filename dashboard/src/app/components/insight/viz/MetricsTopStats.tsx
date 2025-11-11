'use client'

import { PrometheusResponse } from '../../insight/services/adapters/prometheus'
import { formatNumber } from '@lib/format'

interface MetricsTopStatsProps {
  series: PrometheusResponse[]
}

export function MetricsTopStats({ series }: MetricsTopStatsProps) {
  if (!series.length) {
    return <p className="text-sm text-slate-400">Run a query to surface top metrics and aggregates.</p>
  }

  const ranked = series
    .map(item => {
      const values = item.points.map(point => point.value)
      const latest = values.at(-1) ?? 0
      const peak = Math.max(...values)
      return { metric: item.metric, latest, peak }
    })
    .sort((a, b) => b.latest - a.latest)
    .slice(0, 3)

  const overallLatest = ranked.reduce((sum, item) => sum + item.latest, 0)

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner">
        <p className="text-xs uppercase tracking-wide text-slate-500">Combined latest value</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-300">{formatNumber(overallLatest)}</p>
      </div>
      {ranked.map(item => (
        <div
          key={item.metric}
          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">{item.metric}</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{formatNumber(item.latest)}</p>
          <p className="text-xs text-slate-500">Peak {formatNumber(item.peak)}</p>
        </div>
      ))}
    </div>
  )
}
