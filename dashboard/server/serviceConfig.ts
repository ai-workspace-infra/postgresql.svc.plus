import 'server-only'

import { loadRuntimeConfig } from './runtime-loader'

const FALLBACK_ACCOUNT_SERVICE_URL = 'https://accounts.svc.plus'
const FALLBACK_SERVER_SERVICE_URL = 'https://api.svc.plus'
const FALLBACK_SERVER_SERVICE_INTERNAL_URL = 'http://127.0.0.1:8090'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

function getRuntimeDefaultAccountServiceUrl(): string {
  const runtime = loadRuntimeConfig()
  const candidate = typeof runtime.authUrl === 'string' ? runtime.authUrl : undefined
  return candidate ?? FALLBACK_ACCOUNT_SERVICE_URL
}

function getRuntimeDefaultServerServiceUrl(): string {
  const runtime = loadRuntimeConfig()
  const candidate = typeof runtime.apiBaseUrl === 'string' ? runtime.apiBaseUrl : undefined
  return candidate ?? FALLBACK_SERVER_SERVICE_URL
}

function getRuntimeDefaultInternalServerServiceUrl(): string {
  const runtime = loadRuntimeConfig()
  const candidate =
    typeof runtime.internalApiBaseUrl === 'string' ? runtime.internalApiBaseUrl : undefined
  return candidate ?? FALLBACK_SERVER_SERVICE_INTERNAL_URL
}

function readEnvValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = process.env[key]
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

function normalizeBrowserBaseUrl(baseUrl: string): string {
  if (typeof window === 'undefined') {
    return normalizeBaseUrl(baseUrl)
  }

  try {
    const browserOrigin = window.location.origin
    const parsed = new URL(baseUrl, browserOrigin)

    const parsedHostname = parsed.hostname.toLowerCase()
    const browserHostname = window.location.hostname.toLowerCase()

    const parsedIsLocal = LOCAL_HOSTNAMES.has(parsedHostname)
    const browserIsLocal = LOCAL_HOSTNAMES.has(browserHostname)

    if (parsedIsLocal && !browserIsLocal) {
      return normalizeBaseUrl(browserOrigin)
    }

    if (window.location.protocol === 'https:' && parsed.protocol === 'http:' && parsedHostname === browserHostname) {
      parsed.protocol = 'https:'
      return normalizeBaseUrl(parsed.toString())
    }

    return normalizeBaseUrl(parsed.toString())
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to normalize account service base URL, falling back to provided value', error)
    }
    return normalizeBaseUrl(baseUrl)
  }
}

export function getAccountServiceBaseUrl(): string {
  const configured = readEnvValue('ACCOUNT_SERVICE_URL', 'NEXT_PUBLIC_ACCOUNT_SERVICE_URL')
  const resolved = configured ?? getRuntimeDefaultAccountServiceUrl()
  return normalizeBrowserBaseUrl(resolved)
}

export function getAccountServiceApiBaseUrl(): string {
  const accountBaseUrl = getAccountServiceBaseUrl()
  const apiPath = '/api/auth/'
  try {
    const url = new URL(apiPath, accountBaseUrl)
    return normalizeBaseUrl(url.toString())
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to resolve account service API base URL, falling back to concatenation', error)
    }
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
  const fallback = getRuntimeDefaultServerServiceUrl()
  return normalizeBaseUrl(configured ?? fallback)
}

const SERVER_INTERNAL_URL_ENV_KEYS = [
  'SERVER_SERVICE_INTERNAL_URL',
  'SERVER_INTERNAL_URL',
  'INTERNAL_SERVER_SERVICE_URL',
] as const

export function getInternalServerServiceBaseUrl(): string {
  const configured = readEnvValue(...SERVER_INTERNAL_URL_ENV_KEYS)
  if (configured) {
    return normalizeBaseUrl(configured)
  }

  const external = getServerServiceBaseUrl()
  const runtimeInternalDefault = normalizeBaseUrl(getRuntimeDefaultInternalServerServiceUrl())

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
  },
  server: {
    baseUrl: getServerServiceBaseUrl(),
  },
} as const
