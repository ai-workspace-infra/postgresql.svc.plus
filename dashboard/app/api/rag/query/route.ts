import { getInternalServerServiceBaseUrl } from '@server/serviceConfig'

const FORWARDED_HEADERS = ['authorization', 'cookie', 'x-account-session'] as const

function buildForwardHeaders(req: Request) {
  const headers = new Headers({ 'Content-Type': 'application/json' })

  for (const name of FORWARDED_HEADERS) {
    const value = req.headers.get(name)
    if (value) {
      headers.set(name, value)
    }
  }

  return headers
}

export async function POST(req: Request) {
  try {
    const { question, history } = await req.json()
    const apiBase = getInternalServerServiceBaseUrl()
    const response = await fetch(`${apiBase}/api/rag/query`, {
      method: 'POST',
      headers: buildForwardHeaders(req),
      body: JSON.stringify({ question, history }),
      credentials: 'include'
    })

    const data = await response.json().catch(() => null)
    return Response.json(data ?? { error: 'Invalid response from server' }, {
      status: response.status
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
