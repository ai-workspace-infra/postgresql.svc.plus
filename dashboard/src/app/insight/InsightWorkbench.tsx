'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Layout } from 'react-grid-layout'
import { ChevronLeft, ChevronRight, PanelLeftOpen } from 'lucide-react'
import { Sidebar } from '../components/insight/layout/Sidebar'
import { WorkspaceHeader } from '../components/insight/layout/WorkspaceHeader'
import { BreadcrumbBar } from '../components/insight/layout/BreadcrumbBar'
import { WorkspaceGrid } from '../components/insight/layout/WorkspaceGrid'
import { NetworkTopologyPanel } from '../components/insight/topology/NetworkTopologyPanel'
import { ExploreBuilder, languageMeta } from '../components/insight/explore/ExploreBuilder'
import { VizArea } from '../components/insight/viz/VizArea'
import { SLOPanel } from '../components/insight/slo/SLOPanel'
import { AIAssistant } from '../components/insight/ai/Assistant'
import { useInsightState } from '../components/insight/store/useInsightState'
import { DataSource, QueryLanguage } from '../components/insight/store/urlState'

const LAYOUT_STORAGE_KEY = 'insight-workspace-layout-v1'

const DEFAULT_LAYOUT: Layout[] = [
  { i: 'network', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'promql', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'logql', x: 0, y: 8, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'traceql', x: 6, y: 8, w: 6, h: 8, minW: 4, minH: 6 }
]

export default function InsightWorkbench() {
  const { state, updateState, shareableLink } = useInsightState()
  const [activeSection, setActiveSection] = useState('topology')
  const [history, setHistory] = useState<Record<QueryLanguage, string[]>>({
    promql: [],
    logql: [],
    traceql: []
  })
  const [resultData, setResultData] = useState<Record<QueryLanguage, any>>({
    promql: [],
    logql: [],
    traceql: []
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [panelLayout, setPanelLayout] = useState<Layout[]>(() => DEFAULT_LAYOUT.map(item => ({ ...item })))
  const [layoutDirty, setLayoutDirty] = useState(false)
  const [layoutStatus, setLayoutStatus] = useState<string | null>(null)
  const [detailsCollapsed, setDetailsCollapsed] = useState(false)
  const statusTimeout = useRef<number | null>(null)

  const handleSelectSection = useCallback((section: string) => {
    setActiveSection(section)
    const el = document.getElementById(section)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const updateHistory = useCallback(
    (language: QueryLanguage, items: string[]) => {
      setHistory(prev => ({ ...prev, [language]: items }))
    },
    []
  )

  const updateResults = useCallback((language: QueryLanguage, data: any) => {
    setResultData(prev => ({ ...prev, [language]: data }))
  }, [])

  const toggleLanguage = useCallback(
    (language: QueryLanguage) => {
      const exists = state.activeLanguages.includes(language)
      let nextActive = exists
        ? state.activeLanguages.filter(item => item !== language)
        : [...state.activeLanguages, language]
      if (nextActive.length === 0) {
        nextActive = [language]
      }
      const primary = nextActive[0]
      const nextSource: DataSource = primary === 'promql' ? 'metrics' : primary === 'logql' ? 'logs' : 'traces'
      updateState({
        activeLanguages: nextActive,
        queryLanguage: primary,
        dataSource: nextSource
      })
    },
    [state.activeLanguages, updateState]
  )

  const handleLayoutChange = useCallback((next: Layout[]) => {
    setPanelLayout(next)
    setLayoutDirty(true)
  }, [])

  const resetStatusMessage = useCallback(() => {
    if (statusTimeout.current) {
      window.clearTimeout(statusTimeout.current)
      statusTimeout.current = null
    }
  }, [])

  const handleSaveLayout = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(panelLayout))
    setLayoutDirty(false)
    setLayoutStatus('Layout saved locally')
    resetStatusMessage()
    statusTimeout.current = window.setTimeout(() => setLayoutStatus(null), 2200)
  }, [panelLayout, resetStatusMessage])

  const handleResetLayout = useCallback(() => {
    setPanelLayout(DEFAULT_LAYOUT.map(item => ({ ...item })))
    setLayoutDirty(false)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LAYOUT_STORAGE_KEY)
    }
    setLayoutStatus('Layout reset to default')
    resetStatusMessage()
    statusTimeout.current = window.setTimeout(() => setLayoutStatus(null), 2200)
  }, [resetStatusMessage])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as Layout[]
      if (!Array.isArray(parsed)) return
      const merged = DEFAULT_LAYOUT.map(item => {
        const match = parsed.find(entry => entry.i === item.i)
        return match ? { ...item, ...match } : { ...item }
      })
      setPanelLayout(merged)
      setLayoutDirty(false)
    } catch (error) {
      console.error('Failed to restore insight layout', error)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (statusTimeout.current) {
        window.clearTimeout(statusTimeout.current)
      }
    }
  }, [])

  const keyMetrics = useMemo(
    () => [
      {
        label: 'Availability',
        value: state.topologyMode === 'network' ? '99.96%' : '99.90%',
        trend: '+0.3% vs last 7d',
        tone: 'positive' as const
      },
      {
        label: 'P95 latency',
        value: state.topologyMode === 'network' ? '82 ms' : '248 ms',
        trend: `${state.timeRange} window`,
        tone: 'neutral' as const
      },
      {
        label: 'Error rate',
        value: state.topologyMode === 'application' ? '0.7%' : '0.4%',
        trend: 'Target < 1%',
        tone: 'warning' as const
      }
    ],
    [state.timeRange, state.topologyMode]
  )

  const explorerPanels = (language: QueryLanguage, domId?: string) => {
    const enabled = state.activeLanguages.includes(language)
    return {
      id: language,
      domId,
      minW: 4,
      minH: 6,
      content: enabled ? (
        <ExploreBuilder
          state={state}
          updateState={updateState}
          history={history}
          setHistory={updateHistory}
          onResults={updateResults}
          panelLanguages={[language]}
        />
      ) : (
        <DisabledExplorerCard language={language} onEnable={() => toggleLanguage(language)} />
      )
    }
  }

  const panels = [
    {
      id: 'network',
      domId: 'topology',
      minW: 4,
      minH: 6,
      content: <NetworkTopologyPanel state={state} updateState={updateState} />
    },
    explorerPanels('promql', 'explore'),
    explorerPanels('logql'),
    explorerPanels('traceql')
  ]

  const insightAsideWidth = detailsCollapsed ? 'lg:w-60 xl:w-64' : 'lg:w-80 xl:w-96'

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {sidebarHidden && (
        <button
          type="button"
          onClick={() => setSidebarHidden(false)}
          className="fixed left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 shadow-lg backdrop-blur transition hover:border-slate-700 hover:text-slate-100"
        >
          <PanelLeftOpen className="h-4 w-4" />
          Show menu
        </button>
      )}
      <header className="flex-shrink-0 border-b border-slate-800 bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <BreadcrumbBar state={state} updateState={updateState} shareableLink={shareableLink} />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleSaveLayout}
              disabled={!layoutDirty}
              className={`rounded-xl px-3 py-2 font-medium transition ${
                layoutDirty
                  ? 'border border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/80'
                  : 'border border-slate-800 bg-slate-900/70 text-slate-500'
              }`}
            >
              Save layout
            </button>
            <button
              type="button"
              onClick={handleResetLayout}
              className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 font-medium text-slate-300 transition hover:border-slate-700 hover:text-slate-100"
            >
              Reset to default
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {!sidebarHidden && (
          <div className="flex-shrink-0">
            <Sidebar
              topologyMode={state.topologyMode}
              activeLanguages={state.activeLanguages}
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              onTopologyChange={mode => updateState({ topologyMode: mode })}
              onToggleLanguage={toggleLanguage}
              onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
              onHide={() => setSidebarHidden(true)}
              collapsed={sidebarCollapsed}
            />
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
              <main className="flex-1 space-y-6">
                <WorkspaceHeader
                  state={state}
                  updateState={updateState}
                  shareableLink={shareableLink}
                  statusMessage={layoutStatus}
                  showBreadcrumb={false}
                />
                <div id="explore">
                  <WorkspaceGrid
                    layout={panelLayout}
                    defaultLayout={DEFAULT_LAYOUT}
                    panels={panels}
                    onLayoutChange={handleLayoutChange}
                    draggableHandle=".panel-drag-handle"
                  />
                </div>
                <section id="visualize">
                  <VizArea state={state} data={resultData[state.queryLanguage]} onUpdate={updateState} />
                </section>
              </main>
              <aside
                className={`mt-6 w-full flex-shrink-0 lg:mt-0 ${insightAsideWidth} lg:self-stretch lg:overflow-y-auto`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDetailsCollapsed(prev => !prev)}
                      className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-700 hover:text-slate-100"
                    >
                      {detailsCollapsed ? (
                        <>
                          <ChevronLeft className="h-4 w-4" /> Expand insights
                        </>
                      ) : (
                        <>
                          Collapse insights <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                  {detailsCollapsed ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
                      <h3 className="text-sm font-semibold text-slate-100">Key health metrics</h3>
                      <p className="text-[11px] text-slate-500">Pinned while the panel is collapsed for quick status checks.</p>
                      <div className="grid gap-3">
                        {keyMetrics.map(metric => (
                          <div
                            key={metric.label}
                            className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                          >
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">{metric.label}</p>
                            <p className="text-lg font-semibold text-slate-100">{metric.value}</p>
                            <p
                              className={`text-[11px] ${
                                metric.tone === 'positive'
                                  ? 'text-emerald-300'
                                  : metric.tone === 'warning'
                                  ? 'text-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {metric.trend}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <section id="slo">
                        <SLOPanel state={state} />
                      </section>
                      <section id="ai">
                        <AIAssistant state={state} />
                      </section>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DisabledExplorerCardProps {
  language: QueryLanguage
  onEnable: () => void
}

function DisabledExplorerCard({ language, onEnable }: DisabledExplorerCardProps) {
  const meta = languageMeta[language]
  return (
    <section className="flex h-full flex-col rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-5">
      <header className="panel-drag-handle mb-4">
        <h3 className="text-sm font-semibold text-slate-200">{meta.label}</h3>
        <p className="text-xs text-slate-400">Enable this explorer from the navigation to build queries.</p>
      </header>
      <div className="flex flex-1 flex-col items-start justify-center gap-4 text-sm text-slate-400">
        <p>Capture metrics, logs or traces by toggling the language on the left-hand menu.</p>
        <button
          type="button"
          onClick={onEnable}
          className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-400/80"
        >
          Enable {meta.label.split(' ')[0]}
        </button>
      </div>
    </section>
  )
}
