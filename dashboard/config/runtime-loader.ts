import yaml from 'js-yaml'

import baseSource from './runtime-service-config.base.yaml'
import prodSource from './runtime-service-config.prod.yaml'
import sitSource from './runtime-service-config.sit.yaml'

type RuntimeSourceKey = 'base' | 'prod' | 'sit'

export type RuntimeEnvironment = 'prod' | 'sit'
export type RuntimeRegion = 'default' | 'cn' | 'global'

export type RuntimeConfig = {
  apiBaseUrl?: string
  authUrl?: string
  dashboardUrl?: string
  internalApiBaseUrl?: string
  logLevel?: string
  [key: string]: unknown
} & {
  environment: RuntimeEnvironment
  region: RuntimeRegion
  source: RuntimeSourceKey
  hostname?: string
  detectedBy: string
}

const YAML_SOURCES: Record<RuntimeSourceKey, string | undefined> = {
  base: baseSource,
  prod: prodSource,
  sit: sitSource,
}

const parsedYamlCache: Partial<Record<RuntimeSourceKey, Record<string, unknown>>> = {}
const runtimeConfigCache = new Map<string, RuntimeConfig>()

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseYamlSource(sourceKey: RuntimeSourceKey): Record<string, unknown> {
  if (parsedYamlCache[sourceKey]) {
    return parsedYamlCache[sourceKey]!
  }

  const source = YAML_SOURCES[sourceKey]
  if (!source) {
    return {}
  }

  try {
    const parsed = yaml.load(source)
    if (isPlainRecord(parsed)) {
      parsedYamlCache[sourceKey] = parsed
      return parsed
    }

    console.warn(
      `[runtime-config] YAML source "${sourceKey}" did not produce an object. Falling back to empty object.`,
    )
  } catch (error) {
    console.warn(
      `[runtime-config] Failed to parse YAML source "${sourceKey}", falling back to empty object.`,
      error,
    )
  }

  parsedYamlCache[sourceKey] = {}
  return parsedYamlCache[sourceKey]!
}

function mergeConfigs(base: Record<string, unknown>, override?: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  const assignValue = (target: Record<string, unknown>, key: string, value: unknown) => {
    if (Array.isArray(value)) {
      target[key] = value.map((item) => (isPlainRecord(item) ? mergeConfigs({}, item) : item))
      return
    }

    if (isPlainRecord(value)) {
      const existing = isPlainRecord(target[key]) ? (target[key] as Record<string, unknown>) : {}
      target[key] = mergeConfigs(existing, value)
      return
    }

    target[key] = value
  }

  for (const [key, value] of Object.entries(base)) {
    assignValue(result, key, value)
  }

  if (!override) {
    return result
  }

  for (const [key, value] of Object.entries(override)) {
    assignValue(result, key, value)
  }

  return result
}

function sanitizeHostname(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const maybeUrl = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(maybeUrl)
    const hostname = url.hostname.replace(/\.+$/, '').toLowerCase()
    if (hostname) {
      return hostname
    }
  } catch {
    const sanitized = trimmed
      .replace(/^[^/]+:\/\//, '')
      .split('/')[0]
      .split(':')[0]
      .replace(/\.+$/, '')
      .toLowerCase()
    if (sanitized) {
      return sanitized
    }
  }

  return undefined
}

function detectHostname(hostnameOverride?: string): { hostname?: string; detectedBy: string } {
  const override = sanitizeHostname(hostnameOverride)
  if (override) {
    return { hostname: override, detectedBy: 'parameter' }
  }

  if (typeof window !== 'undefined' && typeof window.location?.hostname === 'string') {
    const browserHostname = sanitizeHostname(window.location.hostname)
    if (browserHostname) {
      return { hostname: browserHostname, detectedBy: 'window.location.hostname' }
    }
  }

  const envCandidates: Array<{ source: string; value?: string }> = [
    { source: 'RUNTIME_HOSTNAME', value: process.env.RUNTIME_HOSTNAME },
    { source: 'NEXT_RUNTIME_HOSTNAME', value: process.env.NEXT_RUNTIME_HOSTNAME },
    { source: 'DEPLOYMENT_HOSTNAME', value: process.env.DEPLOYMENT_HOSTNAME },
    { source: 'VERCEL_URL', value: process.env.VERCEL_URL },
    { source: 'NEXT_PUBLIC_VERCEL_URL', value: process.env.NEXT_PUBLIC_VERCEL_URL },
    { source: 'URL', value: process.env.URL },
    { source: 'HOSTNAME', value: process.env.HOSTNAME },
  ]

  for (const candidate of envCandidates) {
    const hostname = sanitizeHostname(candidate.value)
    if (hostname) {
      return { hostname, detectedBy: candidate.source }
    }
  }

  return { hostname: undefined, detectedBy: 'default' }
}

function detectEnvironment(hostname?: string): { environment: RuntimeEnvironment; region: RuntimeRegion; matchedRule: string } {
  const normalized = hostname?.toLowerCase() ?? ''

  let environment: RuntimeEnvironment = 'prod'
  let matchedRule = 'default'

  if (normalized.startsWith('dev.') || normalized.startsWith('dev-') || normalized.includes('.dev.')) {
    environment = 'sit'
    matchedRule = 'dev-subdomain'
  }

  let region: RuntimeRegion = 'default'
  if (normalized.startsWith('cn-')) {
    region = 'cn'
    if (matchedRule === 'default') {
      matchedRule = 'cn-subdomain'
    }
  } else if (normalized.startsWith('global-')) {
    region = 'global'
    if (matchedRule === 'default') {
      matchedRule = 'global-subdomain'
    }
  }

  return { environment, region, matchedRule }
}

function buildCacheKey(hostname?: string, environment?: RuntimeEnvironment, region?: RuntimeRegion): string {
  const keyParts = [hostname || '<unknown>', environment || '<env>', region || '<region>']
  return keyParts.join('|')
}

export function loadRuntimeConfig(options?: { hostname?: string }): RuntimeConfig {
  const { hostname, detectedBy } = detectHostname(options?.hostname)
  const { environment, region, matchedRule } = detectEnvironment(hostname)

  const cacheKey = buildCacheKey(hostname, environment, region)
  const cached = runtimeConfigCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const baseConfig = parseYamlSource('base')
  const envConfig = parseYamlSource(environment)
  const merged = mergeConfigs(baseConfig, envConfig)

  const result: RuntimeConfig = {
    ...(merged as RuntimeConfig),
    environment,
    region,
    source: environment,
    hostname,
    detectedBy: hostname ? `${detectedBy}:${matchedRule}` : detectedBy,
  }

  runtimeConfigCache.set(cacheKey, result)

  const regionLabel = region === 'default' ? '' : `/${region.toUpperCase()} region`
  const hostLabel = hostname ? ` @ ${hostname}` : ''
  console.info(`[runtime-config] Detected env: ${environment.toUpperCase()}${regionLabel}${hostLabel}`)

  return result
}
