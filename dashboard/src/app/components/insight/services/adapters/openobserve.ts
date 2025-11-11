export interface ClientOptions {
  baseUrl?: string
  token?: string
}

export function createOpenObserveClient(options: ClientOptions = {}) {
  const { baseUrl = '/api', token } = options

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers
    })
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json() as Promise<T>
  }

  return { request }
}
