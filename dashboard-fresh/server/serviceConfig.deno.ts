/**
 * Service Configuration - Deno Compatible
 *
 * Provides URLs for backend services (Account Service, Server Service)
 */

const FALLBACK_ACCOUNT_SERVICE_URL = 'https://accounts.svc.plus'
const FALLBACK_SERVER_SERVICE_URL = 'https://api.svc.plus'
const FALLBACK_SERVER_SERVICE_INTERNAL_URL = 'http://127.0.0.1:8090'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

function readEnvValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = Deno.env.get(key)
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
  }
  return undefined
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

export function getAccountServiceBaseUrl(): string {
  const configured = readEnvValue('ACCOUNT_SERVICE_URL', 'NEXT_PUBLIC_ACCOUNT_SERVICE_URL')
  const resolved = configured ?? FALLBACK_ACCOUNT_SERVICE_URL
  return normalizeBaseUrl(resolved)
}

export function getAccountServiceApiBaseUrl(): string {
  const accountBaseUrl = getAccountServiceBaseUrl()
  const apiPath = '/api/auth/'
  try {
    const url = new URL(apiPath, accountBaseUrl)
    return normalizeBaseUrl(url.toString())
  } catch (error) {
    console.warn('Failed to resolve account service API base URL, falling back to concatenation', error)
    const normalizedBase = normalizeBaseUrl(accountBaseUrl)
    return normalizeBaseUrl(`${normalizedBase}${apiPath}`)
  }
}

export function getServerServiceBaseUrl(): string {
  const configured = readEnvValue(
    'SERVER_SERVICE_URL',
    'NEXT_PUBLIC_SERVER_SERVICE_URL',
    'NEXT_PUBLIC_API_BASE_URL',
  )
  const fallback = FALLBACK_SERVER_SERVICE_URL
  return normalizeBaseUrl(configured ?? fallback)
}

export function getInternalServerServiceBaseUrl(): string {
  const configured = readEnvValue(
    'SERVER_SERVICE_INTERNAL_URL',
    'SERVER_INTERNAL_URL',
    'INTERNAL_SERVER_SERVICE_URL',
  )
  if (configured) {
    return normalizeBaseUrl(configured)
  }

  const external = getServerServiceBaseUrl()
  const runtimeInternalDefault = normalizeBaseUrl(FALLBACK_SERVER_SERVICE_INTERNAL_URL)

  try {
    const parsed = new URL(external)
    if (LOCAL_HOSTNAMES.has(parsed.hostname)) {
      if (parsed.hostname !== '127.0.0.1') {
        parsed.hostname = '127.0.0.1'
      }

      if (parsed.protocol === 'https:') {
        parsed.protocol = 'http:'
      }

      return normalizeBaseUrl(parsed.toString())
    }
  } catch {
    // Ignore parsing errors and fall back to the internal default below.
  }

  return runtimeInternalDefault
}

export const serviceConfig = {
  account: {
    baseUrl: getAccountServiceBaseUrl(),
    apiBaseUrl: getAccountServiceApiBaseUrl(),
  },
  server: {
    baseUrl: getServerServiceBaseUrl(),
    internalBaseUrl: getInternalServerServiceBaseUrl(),
  },
} as const
