'use client'

import { PrometheusResponse } from '../../insight/services/adapters/prometheus'
import { formatNumber } from '@lib/format'

interface MetricsTableProps {
  series: PrometheusResponse[]
}

export function MetricsTable({ series }: MetricsTableProps) {
  if (!series.length) {
    return <p className="text-sm text-slate-400">Run a query to inspect series in a tabular view.</p>
  }

  const rows = series.map(item => {
    const values = item.points.map(point => point.value)
    const latest = values.at(-1) ?? 0
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((acc, value) => acc + value, 0) / (values.length || 1)
    return {
      metric: item.metric,
      latest,
      min,
      max,
      avg
    }
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">
              Metric
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Latest
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Average
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Min
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Max
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map(row => (
            <tr key={row.metric} className="bg-slate-950/50">
              <td className="px-4 py-2 font-medium text-slate-100">{row.metric}</td>
              <td className="px-4 py-2">{formatNumber(row.latest)}</td>
              <td className="px-4 py-2">{formatNumber(row.avg)}</td>
              <td className="px-4 py-2">{formatNumber(row.min)}</td>
              <td className="px-4 py-2">{formatNumber(row.max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
