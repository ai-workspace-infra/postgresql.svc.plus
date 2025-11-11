import 'server-only'

import fs from 'fs'
import path from 'path'

import yaml from 'js-yaml'

// 使用 process.cwd() 获取项目根目录，避免 __dirname 在生产环境的问题
const configDir = path.join(process.cwd(), 'src', 'config')

function loadYamlSource(sourceKey: RuntimeSourceKey): string | undefined {
  try {
    const filePath = path.join(configDir, `runtime-service-config.${sourceKey}.yaml`)
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    console.warn(`[runtime-config] Failed to load YAML source "${sourceKey}"`, error)
    return undefined
  }
}

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

export type RuntimeEnvSettings = {
  environment: RuntimeEnvironment
  region: RuntimeRegion
  detectedBy: string
}

const RUNTIME_ENV_CONFIG_BASENAME = '.runtime-env-config.yaml'

// 动态加载 YAML 源文件，避免 Turbopack 编译问题
function getYamlSource(sourceKey: RuntimeSourceKey): string | undefined {
  return loadYamlSource(sourceKey)
}

const parsedYamlCache: Partial<Record<RuntimeSourceKey, Record<string, unknown>>> = {}
const runtimeConfigCache = new Map<string, RuntimeConfig>()

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseYamlSource(sourceKey: RuntimeSourceKey): Record<string, unknown> {
  if (parsedYamlCache[sourceKey]) {
    return parsedYamlCache[sourceKey]!
  }

  const source = getYamlSource(sourceKey)
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
    if (!hostname) {
      continue
    }

    const likelyMachineHostname = !hostname.includes('.') && !LOCAL_HOSTNAMES.has(hostname)
    if (likelyMachineHostname) {
      continue
    }

    if (hostname) {
      return { hostname, detectedBy: candidate.source }
    }
  }

  return { hostname: undefined, detectedBy: 'default' }
}

function normalizeEnvironmentValue(value: unknown): RuntimeEnvironment | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const mapping: Record<string, RuntimeEnvironment> = {
    prod: 'prod',
    production: 'prod',
    release: 'prod',
    main: 'prod',
    live: 'prod',
    sit: 'sit',
    staging: 'sit',
    test: 'sit',
    qa: 'sit',
    uat: 'sit',
    dev: 'sit',
    development: 'sit',
    preview: 'sit',
    preprod: 'sit',
  }

  return mapping[normalized]
}

function normalizeRegionValue(value: unknown): RuntimeRegion | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  if (normalized === 'cn' || normalized === 'china') {
    return 'cn'
  }

  if (normalized === 'global') {
    return 'global'
  }

  if (normalized === 'default') {
    return 'default'
  }

  return undefined
}

let runtimeEnvSettingsCache: RuntimeEnvSettings | undefined

export function readRuntimeEnvSettings(): RuntimeEnvSettings {
  if (runtimeEnvSettingsCache) {
    return runtimeEnvSettingsCache
  }

  // 首先检查 RUNTIME_ENV 环境变量
  const runtimeEnv = process.env.RUNTIME_ENV
  if (runtimeEnv) {
    const environment = normalizeEnvironmentValue(runtimeEnv)
    if (environment) {
      // 检查 REGION 环境变量
      const regionEnv = process.env.REGION
      const region = regionEnv ? normalizeRegionValue(regionEnv) || 'default' : 'default'

      runtimeEnvSettingsCache = {
        environment,
        region,
        detectedBy: 'env:RUNTIME_ENV',
      }
      return runtimeEnvSettingsCache
    }
  }

  const candidates: Array<{ path: string; detectedBy: string }> = []

  const explicitPath = process.env.RUNTIME_ENV_CONFIG_PATH
  if (explicitPath) {
    const resolved = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(process.cwd(), explicitPath)
    candidates.push({ path: resolved, detectedBy: 'env:RUNTIME_ENV_CONFIG_PATH' })
  }

  candidates.push({
    path: path.resolve(process.cwd(), 'dashboard/config', RUNTIME_ENV_CONFIG_BASENAME),
    detectedBy: `file:dashboard/config/${RUNTIME_ENV_CONFIG_BASENAME}`,
  })

  candidates.push({
    path: path.resolve(process.cwd(), 'src', 'config', RUNTIME_ENV_CONFIG_BASENAME),
    detectedBy: `file:config/${RUNTIME_ENV_CONFIG_BASENAME}`,
  })

  candidates.push({
    path: path.resolve(process.cwd(), RUNTIME_ENV_CONFIG_BASENAME),
    detectedBy: `file:${RUNTIME_ENV_CONFIG_BASENAME}`,
  })

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate.path)) {
      continue
    }

    try {
      const content = fs.readFileSync(candidate.path, 'utf8')
      const parsed = yaml.load(content)
      if (!isPlainRecord(parsed)) {
        continue
      }

      const environment = normalizeEnvironmentValue(parsed.environment)
      const regionEnv = process.env.REGION
      const regionFromFile = normalizeRegionValue(parsed.region)
      const region = regionEnv ? (normalizeRegionValue(regionEnv) || 'default') : (regionFromFile ?? 'default')

      if (environment) {
        runtimeEnvSettingsCache = {
          environment,
          region,
          detectedBy: candidate.detectedBy,
        }
        return runtimeEnvSettingsCache
      }
    } catch (error) {
      console.warn(`[runtime-config] Failed to read runtime env config at ${candidate.path}`, error)
    }
  }

  runtimeEnvSettingsCache = {
    environment: 'prod',
    region: 'default',
    detectedBy: 'default',
  }
  return runtimeEnvSettingsCache
}

function splitEnvironmentOverrides(
  environment: RuntimeEnvironment,
  region: RuntimeRegion,
): { environmentOverrides: Record<string, unknown>; regionOverrides?: Record<string, unknown> } {
  const envConfig = parseYamlSource(environment)
  const environmentOverrides = mergeConfigs({}, envConfig)
  let regionOverrides: Record<string, unknown> | undefined

  const maybeRegions = environmentOverrides['regions']
  if (isPlainRecord(maybeRegions)) {
    const normalizedRegion = region.toLowerCase()
    for (const [regionKey, regionValue] of Object.entries(maybeRegions)) {
      if (!isPlainRecord(regionValue)) {
        continue
      }

      if (regionKey.trim().toLowerCase() === normalizedRegion) {
        regionOverrides = mergeConfigs({}, regionValue)
        break
      }
    }
  }

  delete environmentOverrides['regions']

  return { environmentOverrides, regionOverrides }
}

function buildCacheKey(
  hostname?: string,
  environment?: RuntimeEnvironment,
  region?: RuntimeRegion,
): string {
  return [hostname || '<unknown>', environment || '<env>', region || '<region>'].join('|')
}

export function loadRuntimeConfig(options?: { hostname?: string }): RuntimeConfig {
  const { hostname, detectedBy: hostnameDetectedBy } = detectHostname(options?.hostname)
  const { environment, region, detectedBy: envDetectedBy } = readRuntimeEnvSettings()

  const cacheKey = buildCacheKey(hostname, environment, region)
  const cached = runtimeConfigCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const baseConfig = parseYamlSource('base')
  const { environmentOverrides, regionOverrides } = splitEnvironmentOverrides(environment, region)
  const merged = mergeConfigs(baseConfig, environmentOverrides)
  const finalConfig = regionOverrides ? mergeConfigs(merged, regionOverrides) : merged

  const detectionLabel = hostname
    ? `${envDetectedBy}|hostname:${hostnameDetectedBy}`
    : envDetectedBy

  const result: RuntimeConfig = {
    ...(finalConfig as RuntimeConfig),
    environment,
    region,
    source: environment,
    hostname,
    detectedBy: detectionLabel,
  }

  runtimeConfigCache.set(cacheKey, result)

  const regionLabel = region === 'default' ? '' : `/${region.toUpperCase()} region`
  const hostLabel = hostname ? ` @ ${hostname}` : ''
  console.info(`[runtime-config] Loaded env: ${environment.toUpperCase()}${regionLabel}${hostLabel}`)

  return result
}
