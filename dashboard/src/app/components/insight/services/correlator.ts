import { DataSource } from '../store/urlState'

export function buildCorrelatedQuery(source: DataSource, context: {
  service: string
  namespace: string
  timeRange: string
}) {
  const baseLabels = `service="${context.service}"${context.namespace ? `,namespace="${context.namespace}"` : ''}`
  switch (source) {
    case 'metrics':
      return `sum(rate(http_requests_total{${baseLabels}}[5m]))`
    case 'logs':
      return `{${baseLabels}} | json`
    case 'traces':
      return `traces{${baseLabels}} | duration > 50ms`
    default:
      return ''
  }
}
