'use client'

import { LogEntry } from '../../insight/services/adapters/logs'
import { getLogLevelColor } from '@lib/format'

interface LogsTableProps {
  logs: LogEntry[]
}

export function LogsTable({ logs }: LogsTableProps) {
  if (!logs.length) {
    return <p className="text-sm text-slate-400">Run a LogQL query to inspect log lines in a table.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">
              Time
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Level
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Service
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Message
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {logs.map(log => (
            <tr key={`${log.timestamp}-${log.message}`} className="bg-slate-950/50">
              <td className="px-4 py-2 text-xs text-slate-400">
                {new Date(log.timestamp).toLocaleTimeString()}
              </td>
              <td className={`px-4 py-2 text-xs font-semibold ${getLogLevelColor(log.level)}`}>{log.level.toUpperCase()}</td>
              <td className="px-4 py-2 text-xs text-slate-300">{log.service}</td>
              <td className="px-4 py-2 font-mono text-[13px] text-slate-200">{log.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
