'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { buildCorrelatedQuery } from '../../insight/services/correlator'
import { DataSource, InsightState } from '../../insight/store/urlState'
import { MetricsChart } from './MetricsChart'
import { MetricsTable } from './MetricsTable'
import { MetricsTopStats } from './MetricsTopStats'
import { LogsViewer } from './LogsViewer'
import { LogsTable } from './LogsTable'
import { LogsTopStats } from './LogsTopStats'
import { TracesWaterfall } from './TracesWaterfall'
import { TracesTable } from './TracesTable'
import { TracesTopStats } from './TracesTopStats'

type ViewMode = 'trend' | 'table' | 'top'

interface VizAreaProps {
  state: InsightState
  data: any
  onUpdate: (partial: Partial<InsightState>) => void
}

export function VizArea({ state, data, onUpdate }: VizAreaProps) {
  const mode = state.dataSource
  const [viewMode, setViewMode] = useState<ViewMode>('trend')

  useEffect(() => {
    setViewMode('trend')
  }, [mode])

  const viewOptions = useMemo(
    () => [
      { id: 'trend' as ViewMode, label: 'Trend chart' },
      { id: 'table' as ViewMode, label: 'Table' },
      { id: 'top' as ViewMode, label: 'Top stats' }
    ],
    []
  )

  const title = modeLabel[mode]

  function correlate(target: DataSource) {
    const language: InsightState['queryLanguage'] = target === 'metrics' ? 'promql' : target === 'logs' ? 'logql' : 'traceql'
    const query = buildCorrelatedQuery(target, {
      service: state.service || 'checkout',
      namespace: state.namespace,
      timeRange: state.timeRange
    })
    onUpdate({
      dataSource: target,
      queryLanguage: language,
      queries: { ...state.queries, [language]: query },
      activeLanguages: Array.from(new Set([...state.activeLanguages, language]))
    })
  }

  function renderContent(): ReactNode {
    const metricsSeries = Array.isArray(data) ? data : []
    const logs = Array.isArray(data) ? data : []
    const traces = Array.isArray(data) ? data : []

    switch (mode) {
      case 'metrics':
        if (viewMode === 'table') {
          return <MetricsTable series={metricsSeries} />
        }
        if (viewMode === 'top') {
          return <MetricsTopStats series={metricsSeries} />
        }
        return <MetricsChart series={metricsSeries} />
      case 'logs':
        if (viewMode === 'table') {
          return <LogsTable logs={logs} />
        }
        if (viewMode === 'top') {
          return <LogsTopStats logs={logs} />
        }
        return <LogsViewer logs={logs} />
      case 'traces':
        if (viewMode === 'table') {
          return <TracesTable spans={traces} />
        }
        if (viewMode === 'top') {
          return <TracesTopStats spans={traces} />
        }
        return <TracesWaterfall spans={traces} />
      default:
        return null
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/20">
      <div className="flex flex-wrap items-center gap-3">
        {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
        <div className={`${title ? 'ml-auto ' : ''}flex flex-wrap items-center gap-2 text-xs text-slate-300`}>
          <div className="flex overflow-hidden rounded-xl border border-slate-800">
            {viewOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setViewMode(option.id)}
                className={`px-3 py-1 text-xs transition ${
                  viewMode === option.id ? 'bg-slate-800 text-slate-100' : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button onClick={() => correlate('metrics')} className="rounded-xl border border-slate-800 px-3 py-1 hover:bg-slate-800">
            Link to Metrics
          </button>
          <button onClick={() => correlate('logs')} className="rounded-xl border border-slate-800 px-3 py-1 hover:bg-slate-800">
            Link to Logs
          </button>
          <button onClick={() => correlate('traces')} className="rounded-xl border border-slate-800 px-3 py-1 hover:bg-slate-800">
            Link to Traces
          </button>
          <button className="rounded-xl bg-slate-200/10 px-3 py-1 text-slate-200">Save to dashboard</button>
        </div>
      </div>
      <div className="mt-4 min-h-[240px] rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-inner">
        {renderContent()}
      </div>
    </div>
  )
}

const modeLabel: Record<DataSource, string> = {
  metrics: '',
  logs: 'Log stream',
  traces: 'Trace waterfall'
}
