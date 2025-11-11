export type TopologyMode = 'application' | 'network' | 'resource'
export type DataSource = 'metrics' | 'logs' | 'traces'
export type BuilderMode = 'visual' | 'code'
export type QueryLanguage = 'promql' | 'logql' | 'traceql'
export type QueryInputMode = 'ql' | 'menu'

export interface InsightState {
  org: string
  project: string
  env: string
  region: string
  topologyMode: TopologyMode
  namespace: string
  service: string
  dataSource: DataSource
  queryLanguage: QueryLanguage
  queries: Record<QueryLanguage, string>
  activeLanguages: QueryLanguage[]
  builderMode: BuilderMode
  timeRange: string
}

export const DEFAULT_INSIGHT_STATE: InsightState = {
  org: 'global-org',
  project: 'observability',
  env: 'production',
  region: 'us-west-2',
  topologyMode: 'application',
  namespace: 'default',
  service: '',
  dataSource: 'metrics',
  queryLanguage: 'promql',
  queries: {
    promql: 'sum(rate(http_requests_total{job="api"}[5m]))',
    logql: '{service="checkout"} |= "error"',
    traceql: 'traces{service="checkout"} | duration > 250ms'
  },
  activeLanguages: ['promql'],
  builderMode: 'visual',
  timeRange: '1h'
}

const STATE_KEY_MAP: Record<keyof InsightState, string> = {
  org: 'org',
  project: 'proj',
  env: 'env',
  region: 'reg',
  topologyMode: 'mode',
  namespace: 'ns',
  service: 'svc',
  dataSource: 'ds',
  queryLanguage: 'ql',
  queries: 'qs',
  activeLanguages: 'qls',
  builderMode: 'bm',
  timeRange: 'tr'
}

const REVERSE_STATE_KEY_MAP = Object.fromEntries(
  Object.entries(STATE_KEY_MAP).map(([key, value]) => [value, key])
) as Record<string, keyof InsightState>

export function serializeInsightState(state: InsightState): string {
  const params = new URLSearchParams()
  ;(Object.keys(STATE_KEY_MAP) as (keyof InsightState)[]).forEach(key => {
    const value = state[key]
    if (value === undefined || value === null) return

    switch (key) {
      case 'queries': {
        const queries = state.queries
        if (!queries) return
        const customQueries: Partial<Record<QueryLanguage, string>> = {}
        ;(Object.keys(queries) as QueryLanguage[]).forEach(language => {
          if (queries[language] !== DEFAULT_INSIGHT_STATE.queries[language]) {
            customQueries[language] = queries[language]
          }
        })
        if (Object.keys(customQueries).length === 0) return
        params.set(
          STATE_KEY_MAP[key],
          encodeURIComponent(JSON.stringify(customQueries))
        )
        break
      }
      case 'activeLanguages': {
        const activeLanguages = Array.isArray(value)
          ? value
          : [value as QueryLanguage]
        const defaultActive = DEFAULT_INSIGHT_STATE.activeLanguages
        if (
          activeLanguages.length === defaultActive.length &&
          activeLanguages.every((language, index) => language === defaultActive[index])
        ) {
          return
        }
        params.set(STATE_KEY_MAP[key], activeLanguages.join(','))
        break
      }
      default:
        if (value === DEFAULT_INSIGHT_STATE[key]) return
        params.set(STATE_KEY_MAP[key], String(value))
    }
  })
  return params.toString()
}

export function deserializeInsightState(hash: string): InsightState {
  if (!hash) return DEFAULT_INSIGHT_STATE
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(cleanHash)
  const next: InsightState = { ...DEFAULT_INSIGHT_STATE }

  params.forEach((value, key) => {
    const stateKey = REVERSE_STATE_KEY_MAP[key]
    if (!stateKey) return

    switch (stateKey) {
      case 'topologyMode':
        next.topologyMode = value as TopologyMode
        break
      case 'dataSource':
        next.dataSource = value as DataSource
        break
      case 'queryLanguage':
        next.queryLanguage = value as QueryLanguage
        break
      case 'builderMode':
        next.builderMode = value as BuilderMode
        break
      case 'org':
        next.org = value
        break
      case 'project':
        next.project = value
        break
      case 'env':
        next.env = value
        break
      case 'region':
        next.region = value
        break
      case 'namespace':
        next.namespace = value
        break
      case 'service':
        next.service = value
        break
      case 'queries':
        try {
          const decoded = decodeURIComponent(value)
          const parsed = JSON.parse(decoded)
          next.queries = {
            promql: parsed.promql || DEFAULT_INSIGHT_STATE.queries.promql,
            logql: parsed.logql || DEFAULT_INSIGHT_STATE.queries.logql,
            traceql: parsed.traceql || DEFAULT_INSIGHT_STATE.queries.traceql
          }
        } catch (error) {
          console.error('Failed to parse queries from URL state', error)
          next.queries = { ...DEFAULT_INSIGHT_STATE.queries }
        }
        break
      case 'activeLanguages':
        next.activeLanguages = value
          .split(',')
          .map(item => item.trim())
          .filter(Boolean) as QueryLanguage[]
        if (next.activeLanguages.length === 0) {
          next.activeLanguages = [...DEFAULT_INSIGHT_STATE.activeLanguages]
        }
        break
      case 'timeRange':
        next.timeRange = value
        break
      default:
        break
    }
  })

  if (!['application', 'network', 'resource'].includes(next.topologyMode)) {
    next.topologyMode = DEFAULT_INSIGHT_STATE.topologyMode
  }
  if (!['metrics', 'logs', 'traces'].includes(next.dataSource)) {
    next.dataSource = DEFAULT_INSIGHT_STATE.dataSource
  }
  if (!['promql', 'logql', 'traceql'].includes(next.queryLanguage)) {
    next.queryLanguage = DEFAULT_INSIGHT_STATE.queryLanguage
  }
  if (!['visual', 'code'].includes(next.builderMode)) {
    next.builderMode = DEFAULT_INSIGHT_STATE.builderMode
  }
  next.activeLanguages = next.activeLanguages.filter(language =>
    ['promql', 'logql', 'traceql'].includes(language)
  ) as QueryLanguage[]
  if (next.activeLanguages.length === 0) {
    next.activeLanguages = [...DEFAULT_INSIGHT_STATE.activeLanguages]
  }
  if (!next.queries) {
    next.queries = { ...DEFAULT_INSIGHT_STATE.queries }
  } else {
    next.queries = {
      promql: next.queries.promql || DEFAULT_INSIGHT_STATE.queries.promql,
      logql: next.queries.logql || DEFAULT_INSIGHT_STATE.queries.logql,
      traceql: next.queries.traceql || DEFAULT_INSIGHT_STATE.queries.traceql
    }
  }

  return next
}
