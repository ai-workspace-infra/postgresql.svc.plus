'use client'

import { BellRing, Compass, Layers, Sparkles, type LucideIcon, PanelLeftClose, PanelLeftOpen, EyeOff } from 'lucide-react'

import { QueryLanguage, TopologyMode } from '../../insight/store/urlState'

interface SidebarProps {
  topologyMode: TopologyMode
  activeLanguages: QueryLanguage[]
  onSelectSection: (section: string) => void
  onTopologyChange: (mode: TopologyMode) => void
  onToggleLanguage: (language: QueryLanguage) => void
  onToggleCollapse: () => void
  onHide: () => void
  activeSection: string
  collapsed: boolean
}

const sections: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'topology', label: 'Topology', icon: Layers },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'slo', label: 'SLO & Alerts', icon: BellRing },
  { id: 'ai', label: 'AI Assistant', icon: Sparkles }
]

const topologyOptions: { id: TopologyMode; label: string; hint: string }[] = [
  { id: 'application', label: 'Application', hint: 'Services and dependencies' },
  { id: 'network', label: 'Network', hint: 'Gateways, meshes and edges' },
  { id: 'resource', label: 'Resource', hint: 'Clusters, nodes and workloads' }
]

const languageOptions: { id: QueryLanguage; label: string; description: string }[] = [
  { id: 'promql', label: 'PromQL', description: 'Metrics analytics' },
  { id: 'logql', label: 'LogQL', description: 'Log navigation' },
  { id: 'traceql', label: 'TraceQL', description: 'Trace exploration' }
]

export function Sidebar({
  topologyMode,
  activeLanguages,
  activeSection,
  onSelectSection,
  onTopologyChange,
  onToggleLanguage,
  onToggleCollapse,
  onHide,
  collapsed
}: SidebarProps) {
  return (
    <aside
      className={`border-r border-slate-800 bg-slate-900/70 px-3 py-6 backdrop-blur transition-all duration-200 ${
        collapsed ? 'w-20 space-y-6' : 'w-full space-y-7 lg:w-72 xl:w-80'
      }`}
    >
      <div className={`flex items-start justify-between ${collapsed ? 'flex-col items-center gap-4' : ''}`}>
        {!collapsed && (
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-slate-100">Insight Workbench</h1>
            <p className="text-sm text-slate-400">
              Navigate topology, run cross-domain queries and keep SLOs on track.
            </p>
          </div>
        )}
        <div className={`flex items-center gap-2 ${collapsed ? '' : 'ml-2'}`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-slate-700 hover:text-slate-100"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onHide}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-red-500/60 hover:text-red-300"
            aria-label="Hide sidebar"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className={`space-y-1 ${collapsed ? 'flex flex-col items-center gap-2 space-y-0' : ''}`}>
        {sections.map(section => {
          const active = activeSection === section.id
          const Icon = section.icon
          return (
            <div key={section.id} className={`group relative ${collapsed ? 'w-full' : ''}`}>
              <button
                onClick={() => onSelectSection(section.id)}
                className={`w-full rounded-xl transition ${
                  collapsed
                    ? 'flex flex-col items-center gap-2 px-2 py-3'
                    : 'flex items-center gap-3 px-3 py-2 text-left'
                } ${
                  active
                    ? 'bg-slate-800 text-slate-100 shadow-inner shadow-slate-800/60'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
                title={section.label}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                    active ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {!collapsed && <span className="font-medium">{section.label}</span>}
              </button>

              {section.id === 'topology' && (
                <div
                  className={`pointer-events-none absolute z-20 hidden w-60 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-left shadow-xl backdrop-blur transition group-hover:pointer-events-auto group-hover:flex group-focus-within:pointer-events-auto group-focus-within:flex ${
                    collapsed ? 'left-full top-1/2 ml-3 -translate-y-1/2' : 'left-full top-1/2 ml-4 -translate-y-1/2'
                  }`}
                >
                  <div className="flex flex-col gap-2 text-sm text-slate-200">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Topology mode</p>
                      <p className="text-xs text-slate-500">Hover to select how the topology map is rendered.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {topologyOptions.map(option => {
                        const activeMode = topologyMode === option.id
                        return (
                          <button
                            key={option.id}
                            className={`flex flex-col rounded-xl border px-3 py-2 text-left transition ${
                              activeMode
                                ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-200'
                                : 'border-slate-800 bg-slate-900/70 text-slate-200 hover:border-slate-700'
                            }`}
                            onClick={() => onTopologyChange(option.id)}
                            type="button"
                          >
                            <span className="text-sm font-semibold">{option.label}</span>
                            <span className="text-xs text-slate-400">{option.hint}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {section.id === 'explore' && (
                <div
                  className={`pointer-events-none absolute z-20 hidden w-64 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-left shadow-xl backdrop-blur transition group-hover:pointer-events-auto group-hover:flex group-focus-within:pointer-events-auto group-focus-within:flex ${
                    collapsed ? 'left-full top-1/2 ml-3 -translate-y-1/2' : 'left-full top-1/2 ml-4 -translate-y-1/2'
                  }`}
                >
                  <div className="flex flex-col gap-2 text-sm text-slate-200">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Query domains</p>
                      <p className="text-xs text-slate-500">Toggle languages to open matching explorers.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {languageOptions.map(option => {
                        const activeLanguage = activeLanguages.includes(option.id)
                        return (
                          <button
                            key={option.id}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                              activeLanguage
                                ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-200'
                                : 'border-slate-800 bg-slate-900/70 text-slate-200 hover:border-slate-700'
                            }`}
                            onClick={() => onToggleLanguage(option.id)}
                            type="button"
                          >
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-slate-400">{option.description}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div
        className={`rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-800/80 to-slate-900 shadow-inner ${
          collapsed ? 'p-3' : 'p-4'
        }`}
      >
        {!collapsed ? (
          <>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Active explorers</p>
            <ul className="space-y-1 text-sm text-slate-300">
              {activeLanguages.map(language => (
                <li key={language} className="flex items-center justify-between">
                  <span>{languageLabels[language]}</span>
                  <span className="text-xs text-slate-500">QL</span>
                </li>
              ))}
              {activeLanguages.length === 0 && <li className="text-xs text-slate-500">No languages selected.</li>}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Active</p>
            <div className="flex flex-col items-center gap-1 text-[10px] text-slate-300">
              {activeLanguages.map(language => (
                <span key={language}>{languageLabels[language]}</span>
              ))}
              {activeLanguages.length === 0 && <span className="text-slate-500">None</span>}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

const languageLabels: Record<QueryLanguage, string> = {
  promql: 'Prometheus metrics',
  logql: 'Log stream',
  traceql: 'Distributed traces'
}
