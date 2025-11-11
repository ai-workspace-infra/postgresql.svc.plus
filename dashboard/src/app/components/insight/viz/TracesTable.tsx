'use client'

import { TraceSpan } from '../../insight/services/adapters/traces'

interface TracesTableProps {
  spans: TraceSpan[]
}

export function TracesTable({ spans }: TracesTableProps) {
  if (!spans.length) {
    return <p className="text-sm text-slate-400">Run a TraceQL query to review spans in a table.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">
              Span
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Service
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Duration (ms)
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Start time
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {spans.map(span => (
            <tr key={span.id} className="bg-slate-950/50">
              <td className="px-4 py-2 font-medium text-slate-100">{span.name}</td>
              <td className="px-4 py-2 text-xs text-slate-300">{span.service}</td>
              <td className="px-4 py-2 text-xs text-slate-300">{span.durationMs.toFixed(1)}</td>
              <td className="px-4 py-2 text-xs text-slate-400">
                {new Date(span.startTime).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
