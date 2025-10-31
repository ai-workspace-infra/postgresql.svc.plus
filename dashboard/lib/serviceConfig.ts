import runtimeServiceConfigSource from '../config/runtime-service-config.yaml'

type ServiceRuntimeConfig = {
  baseUrl?: string
}

type EnvironmentRuntimeConfig = {
  accountService?: ServiceRuntimeConfig
  serverService?: ServiceRuntimeConfig
}

type RuntimeServiceConfig = {
  defaultEnvironment?: string
  defaults?: EnvironmentRuntimeConfig
  environments?: Record<string, EnvironmentRuntimeConfig>
}

type StackEntry = {
  indent: number
  value: Record<string, unknown>
}

function parseSimpleYaml(source: string): RuntimeServiceConfig {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, ''))
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => line.trim().length > 0)

  const root: Record<string, unknown> = {}
  const stack: StackEntry[] = [{ indent: -1, value: root }]

  for (const line of lines) {
    const indent = line.match(/^\s*/)![0].length
    const trimmed = line.trim()

    const separatorIndex = trimmed.indexOf(':')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop()
    }

    const parent = stack[stack.length - 1].value

    if (rawValue.length === 0) {
      const child: Record<string, unknown> = {}
      parent[key] = child
      stack.push({ indent, value: child })
    } else {
      parent[key] = rawValue
    }
  }

  return root as RuntimeServiceConfig
}

const runtimeServiceConfig = parseSimpleYaml(runtimeServiceConfigSource)

const runtimeEnvironments: Record<string, EnvironmentRuntimeConfig> =
  runtimeServiceConfig.environments ?? {}

type RuntimeEnvironmentName = keyof typeof runtimeEnvironments

const runtimeEnvironmentNames = Object.keys(
  runtimeEnvironments,
) as RuntimeEnvironmentName[]
const hasRuntimeEnvironments = runtimeEnvironmentNames.length > 0

type ServiceKey = keyof EnvironmentRuntimeConfig

const FALLBACK_ACCOUNT_SERVICE_URL = 'https://accounts.svc.plus'
const FALLBACK_SERVER_SERVICE_URL = 'https://api.svc.plus'
const FALLBACK_SERVER_SERVICE_INTERNAL_URL = 'http://127.0.0.1:8090'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

function getRuntimeServiceBaseUrl(serviceKey: ServiceKey): string | undefined {
  const runtimeDefaults = runtimeServiceConfig.defaults?.[serviceKey]?.baseUrl

  if (!hasRuntimeEnvironments) {
    return runtimeDefaults
  }

  const environmentName = resolveRuntimeEnvironment()
  const environmentValue = environmentName
    ? runtimeEnvironments[environmentName]?.[serviceKey]?.baseUrl
    : undefined

  return environmentValue ?? runtimeDefaults
}

const DEFAULT_ACCOUNT_SERVICE_URL =
  getRuntimeServiceBaseUrl('accountService') ?? FALLBACK_ACCOUNT_SERVICE_URL
const DEFAULT_SERVER_SERVICE_URL =
  getRuntimeServiceBaseUrl('serverService') ?? FALLBACK_SERVER_SERVICE_URL

function normalizeEnvKey(value?: string | null): string | undefined {
  if (!value) return undefined
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function resolveRuntimeEnvironment(): RuntimeEnvironmentName | undefined {
  if (!hasRuntimeEnvironments) {
    return undefined
  }

  const envCandidates = [
    process.env.NEXT_PUBLIC_RUNTIME_ENV,
    process.env.NEXT_RUNTIME_ENV,
    process.env.RUNTIME_ENV,
    process.env.APP_ENV,
    process.env.NODE_ENV,
    runtimeServiceConfig.defaultEnvironment,
  ]

  for (const candidate of envCandidates) {
    const normalizedCandidate = normalizeEnvKey(candidate)
    if (!normalizedCandidate) continue

    const matchedEntry = runtimeEnvironmentNames.find(
      (key) => normalizeEnvKey(key) === normalizedCandidate,
    )

    if (matchedEntry) {
      return matchedEntry
    }
  }

  return undefined
}

function getRuntimeAccountServiceBaseUrl(): string | undefined {
  const environmentName = resolveRuntimeEnvironment()
  const runtimeDefaults = runtimeServiceConfig.defaults?.accountService?.baseUrl

  if (!hasRuntimeEnvironments) {
    return runtimeDefaults
  }

  const environmentValue = environmentName
    ? runtimeEnvironments[environmentName]?.accountService?.baseUrl
    : undefined

  return runtimeDefaults ?? environmentValue
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
  const resolved = configured ?? DEFAULT_ACCOUNT_SERVICE_URL
  return normalizeBrowserBaseUrl(resolved)
}

export function getServerServiceBaseUrl(): string {
  const configured = readEnvValue(
    'SERVER_SERVICE_URL',
    'NEXT_PUBLIC_SERVER_SERVICE_URL',
    'NEXT_PUBLIC_API_BASE_URL',
  )
  return normalizeBaseUrl(configured ?? DEFAULT_SERVER_SERVICE_URL)
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

  return normalizeBaseUrl(FALLBACK_SERVER_SERVICE_INTERNAL_URL)
}

export const serviceConfig = {
  account: {
    baseUrl: getAccountServiceBaseUrl(),
  },
  server: {
    baseUrl: getServerServiceBaseUrl(),
  },
} as const
