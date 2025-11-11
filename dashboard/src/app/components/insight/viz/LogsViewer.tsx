'use client'

import { LogEntry } from '../../insight/services/adapters/logs'
import { getLogLevelColor } from '@lib/format'

interface LogsViewerProps {
  logs: LogEntry[]
}

export function LogsViewer({ logs }: LogsViewerProps) {
  if (!logs.length) {
    return <p className="text-sm text-slate-400">Run a LogQL query to inspect log events.</p>
  }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div
          key={`${log.timestamp}-${log.message}`}
          className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200 shadow-inner"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={getLogLevelColor(log.level)}>{log.level.toUpperCase()}</span>
          </div>
          <p className="mt-2 font-mono text-[13px] text-slate-300">{log.message}</p>
          {log.fields && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900/80 p-2 text-[11px] text-slate-400">
              {JSON.stringify(log.fields, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}
