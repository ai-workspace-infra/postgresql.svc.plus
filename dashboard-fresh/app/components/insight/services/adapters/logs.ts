import { createOpenObserveClient } from './openobserve'

export interface LogEntry {
  timestamp: number
  message: string
  level: string
  service: string
  fields?: Record<string, any>
}

const mockLogs: LogEntry[] = Array.from({ length: 25 }).map((_, idx) => ({
  timestamp: Date.now() - idx * 15000,
  message: `Request handled with status ${idx % 5 === 0 ? 500 : 200}`,
  level: idx % 5 === 0 ? 'error' : idx % 3 === 0 ? 'warn' : 'info',
  service: idx % 2 === 0 ? 'checkout' : 'payments',
  fields: {
    traceId: `trace-${idx}`,
    spanId: `span-${idx}`
  }
}))

export async function fetchLogs(query: string) {
  void query
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockLogs
}

export function createLogsAdapter(baseUrl?: string, token?: string) {
  const client = createOpenObserveClient({ baseUrl, token })
  return {
    async queryLogs(query: string, params?: Record<string, string>) {
      void params
      try {
        return await client.request<LogEntry[]>(`/logs/query`, {
          method: 'POST',
          body: JSON.stringify({ query })
        })
      } catch (err) {
        console.warn('Logs adapter fallback to mock', err)
        return fetchLogs(query)
      }
    }
  }
}
