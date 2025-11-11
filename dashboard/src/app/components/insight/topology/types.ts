export interface TopologyNode {
  id: string
  label: string
  type: 'service' | 'gateway' | 'database' | 'network'
  status: 'healthy' | 'warning' | 'critical'
  x: number
  y: number
  service?: string
}

export interface TopologyEdge {
  id: string
  from: string
  to: string
  latencyMs: number
}
