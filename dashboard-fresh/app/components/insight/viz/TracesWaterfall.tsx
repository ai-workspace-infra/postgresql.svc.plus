'use client'

import { TraceSpan } from '../../insight/services/adapters/traces'

interface TracesWaterfallProps {
  spans: TraceSpan[]
}

export function TracesWaterfall({ spans }: TracesWaterfallProps) {
  if (!spans.length) {
    return <p className="text-sm text-slate-400">Run a TraceQL query to render waterfall timelines.</p>
  }

  const rootStart = Math.min(...spans.map(span => span.startTime))
  const totalDuration = Math.max(...spans.map(span => span.startTime + span.durationMs)) - rootStart || 1

  return (
    <div className="space-y-2">
      {spans.map(span => {
        const offset = ((span.startTime - rootStart) / totalDuration) * 100
        const width = (span.durationMs / totalDuration) * 100
        return (
          <div key={span.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-200">{span.name}</span>
              <span>{span.durationMs.toFixed(1)} ms</span>
            </div>
            <div className="relative h-8 rounded-xl bg-slate-900/80">
              <div
                className="absolute top-1 h-6 rounded-xl bg-emerald-500/40"
                style={{ left: `${offset}%`, width: `${Math.max(width, 4)}%` }}
              >
                <span className="absolute left-2 top-1 text-[11px] text-emerald-950">{span.service}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
