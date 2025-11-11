'use client'

import { useMemo, useState } from 'react'

import { InsightState } from '../../insight/store/urlState'
import { TopologyCanvas } from './TopologyCanvas'

interface NetworkTopologyPanelProps {
  state: InsightState
  updateState: (partial: Partial<InsightState>) => void
}

export function NetworkTopologyPanel({ state, updateState }: NetworkTopologyPanelProps) {
  const [advancedVisible, setAdvancedVisible] = useState(false)

  const subtitle = useMemo(
    () => `${state.env} · ${state.region} · ${state.org}/${state.project}`,
    [state.env, state.org, state.project, state.region]
  )

  return (
    <section
      id="topology"
      className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/20"
    >
      <header className="panel-drag-handle flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-200">Network topology</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <button
            type="button"
            onClick={() => setAdvancedVisible(prev => !prev)}
            className="rounded-xl border border-slate-800 px-3 py-1 transition hover:border-slate-700 hover:text-slate-100"
          >
            {advancedVisible ? 'Hide advanced filters' : 'Show advanced filters'}
          </button>
          <button
            type="button"
            onClick={() => updateState({ topologyMode: 'network' })}
            className="rounded-xl border border-emerald-600/50 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-200 shadow-inner shadow-emerald-500/20 transition hover:border-emerald-400/70"
          >
            Focus network
          </button>
        </div>
      </header>

      {advancedVisible && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
          <TextField
            label="Namespace"
            value={state.namespace}
            placeholder="default"
            onChange={value => updateState({ namespace: value })}
          />
          <TextField
            label="Service"
            value={state.service}
            placeholder="all services"
            onChange={value => updateState({ service: value })}
          />
        </div>
      )}

      <div className="mt-5 flex-1 overflow-hidden">
        <TopologyCanvas state={state} updateState={updateState} />
      </div>
    </section>
  )
}

interface TextFieldProps {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}

function TextField({ label, value, placeholder, onChange }: TextFieldProps) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-sm text-slate-200 focus:outline-none"
      />
    </label>
  )
}
