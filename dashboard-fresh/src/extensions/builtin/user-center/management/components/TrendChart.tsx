'use client'

import { useMemo, useState } from 'react'
import Card from '../../components/Card'

export type MetricsPoint = {
  period: string
  total: number
  active: number
  subscribed: number
}

export type MetricsSeries = {
  daily: MetricsPoint[]
  weekly: MetricsPoint[]
}

type TrendChartProps = {
  series?: MetricsSeries
  isLoading?: boolean
}

type Granularity = 'daily' | 'weekly'

function buildSparkline(points: MetricsPoint[]) {
  if (!points || points.length === 0) {
    return ''
  }
  const totals = points.map((point) => point.total)
  const maxValue = Math.max(...totals, 1)
  const lastIndex = totals.length - 1 || 1
  return totals
    .map((value, index) => {
      const x = (index / lastIndex) * 100
      const y = 100 - (value / maxValue) * 100
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

export function TrendChart({ series, isLoading = false }: TrendChartProps) {
  const [granularity, setGranularity] = useState<Granularity>('daily')

  const points = useMemo(() => {
    if (!series) {
      return [] as MetricsPoint[]
    }
    return granularity === 'daily' ? series.daily : series.weekly
  }, [granularity, series])

  const sparklinePath = useMemo(() => buildSparkline(points), [points])

  return (
    <Card>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">趋势</h2>
            <p className="text-sm text-gray-500">按时间观察用户总量与活跃度的变化</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 p-1 text-xs shadow-sm">
            {(
              [
                { key: 'daily', label: '按日' },
                { key: 'weekly', label: '按周' },
              ] as Array<{ key: Granularity; label: string }>
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                className={`rounded-full px-3 py-1 font-medium transition ${
                  granularity === option.key
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-600 hover:bg-purple-50'
                }`}
                onClick={() => setGranularity(option.key)}
                aria-pressed={granularity === option.key}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-col gap-4" aria-busy={isLoading} aria-live="polite">
          <div className="relative h-32 w-full overflow-hidden rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            {isLoading ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-purple-100/60 to-transparent" />
            ) : sparklinePath ? (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full text-purple-500">
                <path
                  d={`${sparklinePath}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">暂无数据</div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">时间</th>
                  <th className="px-3 py-2 font-medium">总用户</th>
                  <th className="px-3 py-2 font-medium">活跃</th>
                  <th className="px-3 py-2 font-medium">订阅</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/80">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-3 py-3">
                          <span className="inline-block h-4 w-24 rounded bg-gray-200" />
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-block h-4 w-16 rounded bg-gray-200" />
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-block h-4 w-16 rounded bg-gray-200" />
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-block h-4 w-16 rounded bg-gray-200" />
                        </td>
                      </tr>
                    ))
                  : points.map((point) => (
                      <tr key={`${granularity}-${point.period}`} className="transition hover:bg-purple-50/50">
                        <td className="px-3 py-2 font-medium text-gray-700">{point.period}</td>
                        <td className="px-3 py-2 text-gray-900">{point.total}</td>
                        <td className="px-3 py-2 text-gray-900">{point.active}</td>
                        <td className="px-3 py-2 text-gray-900">{point.subscribed}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TrendChart
