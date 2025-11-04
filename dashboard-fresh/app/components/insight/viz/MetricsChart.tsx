'use client'

import { PrometheusResponse } from '../../insight/services/adapters/prometheus'
import { formatNumber } from '@lib/format'

interface MetricsChartProps {
  series: PrometheusResponse[]
}

export function MetricsChart({ series }: MetricsChartProps) {
  if (!series.length) {
    return <p className="text-sm text-slate-400">Run a query to render time series data.</p>
  }

  const width = 520
  const height = 200
  const flat = series.flatMap(s => s.points)
  const min = Math.min(...flat.map(p => p.value))
  const max = Math.max(...flat.map(p => p.value))
  const range = max - min || 1

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {series.map((s, idx) => {
        const path = s.points
          .map((point, i) => {
            const x = (i / Math.max(1, s.points.length - 1)) * (width - 40) + 20
            const y = height - 20 - ((point.value - min) / range) * (height - 40)
            return `${i === 0 ? 'M' : 'L'}${x},${y}`
          })
          .join(' ')
        const color = palette[idx % palette.length]
        return (
          <g key={s.metric}>
            <path d={path} fill="none" stroke={color} strokeWidth={2} />
            <text x={24} y={20 + idx * 16} className="fill-slate-300 text-[11px]">
              {s.metric}: {formatNumber(s.points[s.points.length - 1]?.value ?? 0)}
            </text>
          </g>
        )
      })}
      <line x1={20} y1={height - 20} x2={width - 20} y2={height - 20} stroke="#1e293b" />
      <line x1={20} y1={20} x2={20} y2={height - 20} stroke="#1e293b" />
    </svg>
  )
}

const palette = ['#34d399', '#60a5fa', '#fbbf24']
