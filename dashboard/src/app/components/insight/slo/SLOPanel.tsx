'use client'

import { useState } from 'react'
import { InsightState, TopologyMode } from '../../insight/store/urlState'
import { AlertWizard } from './AlertWizard'

interface Template {
  name: string
  title: string
  description: string
  condition: string
  hint: string
}

const templateLibrary: Record<TopologyMode, Template[]> = {
  application: [
    {
      name: 'app-availability',
      title: 'Availability ≥ 99.9%',
      description: 'Golden signal uptime goal across the selected service mesh.',
      condition: 'avg_over_time(up{namespace="default"}[30d]) < 0.999',
      hint: 'Map to your core services, adjust window and rollup.'
    },
    {
      name: 'app-latency',
      title: 'P95 latency < 300ms',
      description: 'Track tail latency for customer-facing endpoints.',
      condition: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m]))) > 0.3',
      hint: 'Swap service label and percentile to match expectations.'
    },
    {
      name: 'app-error',
      title: 'Error rate < 1%',
      description: 'Alert when errors exceed the burn rate for this application.',
      condition:
        'sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01',
      hint: 'Tune thresholds per service-level objective.'
    }
  ],
  network: [
    {
      name: 'net-availability',
      title: 'L4 success rate ≥ 99.95%',
      description: 'Monitor gateway and load-balancer success ratio.',
      condition: 'avg_over_time(connection_success_total[30d]) < 0.9995',
      hint: 'Hook into your L4 metrics exporter or eBPF pipeline.'
    },
    {
      name: 'net-latency',
      title: 'Network latency < 80ms',
      description: 'Watch round-trip time between edge and cluster ingress.',
      condition: 'histogram_quantile(0.95, sum(rate(network_rtt_bucket[5m]))) > 0.08',
      hint: 'Adjust quantiles per region or provider SLA.'
    },
    {
      name: 'net-packets',
      title: 'Packet drop < 0.1%',
      description: 'Alert when drops spike on critical gateways.',
      condition: 'sum(rate(packet_drop_total[5m])) / sum(rate(packet_total[5m])) > 0.001',
      hint: 'Swap metrics for your own networking stack.'
    }
  ],
  resource: [
    {
      name: 'res-cpu',
      title: 'CPU saturation < 75%',
      description: 'Keep node CPU usage below target across the fleet.',
      condition: 'avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) < 0.25',
      hint: 'Track per node pool or namespace as needed.'
    },
    {
      name: 'res-memory',
      title: 'Memory headroom > 30%',
      description: 'Alert when memory usage trends toward exhaustion.',
      condition: 'avg(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.3',
      hint: 'Swap metrics for container-level if required.'
    },
    {
      name: 'res-storage',
      title: 'Storage IO latency < 20ms',
      description: 'Keep disk IO latency within SLO budgets.',
      condition: 'avg(rate(node_disk_io_time_seconds_total[5m])) > 0.02',
      hint: 'Extend with per-volume thresholds or burst alerts.'
    }
  ]
}

interface SLOPanelProps {
  state: InsightState
}

export function SLOPanel({ state }: SLOPanelProps) {
  const templates = templateLibrary[state.topologyMode]
  const [selected, setSelected] = useState<Template | null>(null)

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/20">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">SLO templates</h3>
        <p className="text-xs text-slate-400">
          Golden signals curated for {modeTitles[state.topologyMode]}. ({state.env} / {state.region})
        </p>
        <p className="text-[11px] text-slate-500">Extend or replace each template with your own objectives.</p>
      </div>
      <div className="space-y-3">
        {templates.map(template => (
          <button
            key={template.name}
            onClick={() => setSelected(template)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left transition hover:border-emerald-500/60"
          >
            <p className="text-sm font-medium text-slate-200">{template.title}</p>
            <p className="text-xs text-slate-400">{template.description}</p>
            <p className="text-[11px] text-slate-500">{template.hint}</p>
          </button>
        ))}
      </div>
      {selected && <AlertWizard template={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

const modeTitles: Record<TopologyMode, string> = {
  application: 'application monitoring',
  network: 'L4 network health',
  resource: 'infrastructure resources'
}
