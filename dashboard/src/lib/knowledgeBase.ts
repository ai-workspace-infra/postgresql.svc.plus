import { getServerServiceBaseUrl } from '../server/serviceConfig'

export async function fetchRelatedDocs(query: string): Promise<string[]> {
  const apiBase = getServerServiceBaseUrl()
  try {
    const res = await fetch(`${apiBase}/api/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: query })
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.chunks || []).map((c: any) => `${c.repo}:${c.path}`)
  } catch (err) {
    console.warn('fetchRelatedDocs failed', err)
    return []
  }
}
