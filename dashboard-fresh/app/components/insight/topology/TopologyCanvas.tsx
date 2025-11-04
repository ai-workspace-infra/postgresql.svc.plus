'use client'

import { MouseEvent, useMemo, useState } from 'react'
import { buildCorrelatedQuery } from '../../insight/services/correlator'
import { InsightState } from '../../insight/store/urlState'
import { TopologyEdge, TopologyNode } from './types'

interface TopologyCanvasProps {
  state: InsightState
  updateState: (partial: Partial<InsightState>) => void
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  node?: TopologyNode
}

export function TopologyCanvas({ state, updateState }: TopologyCanvasProps) {
  const nodes = useMemo(() => createMockNodes(state.topologyMode), [state.topologyMode])
  const edges = useMemo(() => createMockEdges(nodes), [nodes])
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 })

  function handleNodeClick(node: TopologyNode) {
    if (node.service) {
      updateState({ service: node.service })
    }
  }

  function handleContextMenu(event: MouseEvent, node: TopologyNode) {
    event.preventDefault()
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      node
    })
  }

  function handleInspect(target: 'metrics' | 'logs' | 'traces') {
    if (!contextMenu.node) return
    const query = buildCorrelatedQuery(target, {
      service: contextMenu.node.service ?? contextMenu.node.label,
      namespace: state.namespace,
      timeRange: state.timeRange
    })
    const language = target === 'metrics' ? 'promql' : target === 'logs' ? 'logql' : 'traceql'
    updateState({
      dataSource: target,
      queryLanguage: language,
      queries: { ...state.queries, [language]: query },
      activeLanguages: Array.from(new Set([...state.activeLanguages, language])),
      service: contextMenu.node.service ?? contextMenu.node.label
    })
    setContextMenu({ visible: false, x: 0, y: 0 })
  }

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-inner">
      <svg viewBox="0 0 600 320" className="h-80 w-full">
        {edges.map(edge => {
          const from = nodes.find(n => n.id === edge.from)
          const to = nodes.find(n => n.id === edge.to)
          if (!from || !to) return null
          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#334155"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
              <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 8} className="fill-slate-400 text-[10px]">
                {edge.latencyMs.toFixed(0)}ms
              </text>
            </g>
          )
        })}
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
          </marker>
        </defs>
        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x - 60}, ${node.y - 24})`}
            className="cursor-pointer"
            onClick={() => handleNodeClick(node)}
            onContextMenu={event => handleContextMenu(event, node)}
          >
            <rect
              width={120}
              height={48}
              rx={18}
              className={`stroke-2 ${statusStyles[node.status]} ${
                state.service === node.service ? 'stroke-emerald-400' : 'stroke-transparent'
              }`}
            />
            <rect
              width={120}
              height={48}
              rx={18}
              className={`fill-slate-900/90 backdrop-blur ${state.service === node.service ? 'ring-2 ring-emerald-400/60' : ''}`}
            />
            <text x={16} y={22} className="fill-slate-200 text-sm font-medium">
              {node.label}
            </text>
            <text x={16} y={36} className="fill-slate-500 text-[11px] uppercase tracking-wide">
              {node.type}
            </text>
          </g>
        ))}
      </svg>
      {contextMenu.visible && contextMenu.node && (
        <div
          className="absolute z-20 rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-2 text-sm text-slate-200 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Inspect {contextMenu.node.label}</p>
          <div className="flex flex-col">
            <button onClick={() => handleInspect('metrics')} className="rounded-lg px-2 py-1 text-left hover:bg-slate-800">
              View Metrics
            </button>
            <button onClick={() => handleInspect('logs')} className="rounded-lg px-2 py-1 text-left hover:bg-slate-800">
              View Logs
            </button>
            <button onClick={() => handleInspect('traces')} className="rounded-lg px-2 py-1 text-left hover:bg-slate-800">
              View Traces
            </button>
          </div>
        </div>
      )}
      {contextMenu.visible && (
        <div className="absolute inset-0" onClick={() => setContextMenu({ visible: false, x: 0, y: 0 })} />
      )}
    </div>
  )
}

function createMockNodes(mode: InsightState['topologyMode']): TopologyNode[] {
  switch (mode) {
    case 'network':
      return [
        { id: '1', label: 'Edge Router', type: 'network', status: 'healthy', x: 100, y: 140 },
        { id: '2', label: 'Service Mesh', type: 'network', status: 'warning', x: 260, y: 140 },
        { id: '3', label: 'Kubernetes', type: 'network', status: 'healthy', x: 440, y: 140 }
      ]
    case 'resource':
      return [
        { id: 'node', label: 'Node pool', type: 'database', status: 'healthy', x: 120, y: 160 },
        { id: 'pod', label: 'Checkout pod', type: 'service', status: 'warning', x: 300, y: 120, service: 'checkout' },
        { id: 'db', label: 'Postgres', type: 'database', status: 'critical', x: 480, y: 180, service: 'postgres' }
      ]
    default:
      return [
        { id: 'gw', label: 'API Gateway', type: 'gateway', status: 'healthy', x: 120, y: 120, service: 'gateway' },
        { id: 'checkout', label: 'Checkout', type: 'service', status: 'warning', x: 300, y: 160, service: 'checkout' },
        { id: 'payments', label: 'Payments', type: 'service', status: 'healthy', x: 480, y: 120, service: 'payments' }
      ]
  }
}

function createMockEdges(nodes: TopologyNode[]): TopologyEdge[] {
  if (nodes.length < 2) return []
  const edges: TopologyEdge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ id: `${nodes[i].id}-${nodes[i + 1].id}`, from: nodes[i].id, to: nodes[i + 1].id, latencyMs: 20 + i * 15 })
  }
  return edges
}

const statusStyles: Record<TopologyNode['status'], string> = {
  healthy: 'stroke-emerald-500/60',
  warning: 'stroke-amber-400/60',
  critical: 'stroke-red-500/60'
}
