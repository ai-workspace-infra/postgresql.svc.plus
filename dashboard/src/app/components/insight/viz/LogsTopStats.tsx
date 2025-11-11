'use client'

import { LogEntry } from '../../insight/services/adapters/logs'

interface LogsTopStatsProps {
  logs: LogEntry[]
}

export function LogsTopStats({ logs }: LogsTopStatsProps) {
  if (!logs.length) {
    return <p className="text-sm text-slate-400">Run a LogQL query to review top-level log insights.</p>
  }

  const total = logs.length
  const errorCount = logs.filter(log => log.level.toLowerCase() === 'error').length
  const errorRate = total ? (errorCount / total) * 100 : 0

  const serviceCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.service] = (acc[log.service] ?? 0) + 1
    return acc
  }, {})
  const [topService, topServiceCount] = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]

  const levelCounts = logs.reduce<Record<string, number>>((acc, log) => {
    const level = log.level.toUpperCase()
    acc[level] = (acc[level] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner">
        <p className="text-xs uppercase tracking-wide text-slate-500">Log volume</p>
        <p className="mt-1 text-2xl font-semibold text-slate-100">{total}</p>
        <p className="text-xs text-slate-500">Entries returned</p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner">
        <p className="text-xs uppercase tracking-wide text-slate-500">Error rate</p>
        <p className="mt-1 text-2xl font-semibold text-rose-300">{errorRate.toFixed(1)}%</p>
        <p className="text-xs text-slate-500">{errorCount} errors</p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner">
        <p className="text-xs uppercase tracking-wide text-slate-500">Top service</p>
        <p className="mt-1 text-xl font-semibold text-slate-100">{topService ?? 'unknown'}</p>
        <p className="text-xs text-slate-500">{topServiceCount ?? 0} entries</p>
      </div>
      <div className="sm:col-span-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-inner">
        <p className="text-xs uppercase tracking-wide text-slate-500">Level distribution</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {Object.entries(levelCounts).map(([level, count]) => (
            <span key={level} className="rounded-full border border-slate-800 px-3 py-1 text-slate-300">
              {level}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
