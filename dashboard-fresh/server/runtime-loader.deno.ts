/**
 * Deno Native Runtime Configuration Loader
 *
 * Loads environment-specific configuration from YAML files.
 * Supports SIT and PROD environments with region-based overrides.
 */

import yaml from 'js-yaml'

export type RuntimeEnvironment = 'prod' | 'sit'
export type RuntimeRegion = 'default' | 'cn' | 'global'

export interface RuntimeConfig {
  apiBaseUrl: string
  authUrl: string
  dashboardUrl: string
  internalApiBaseUrl?: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  environment: RuntimeEnvironment
  region: RuntimeRegion
}

interface YamlConfig {
  apiBaseUrl?: string
  authUrl?: string
  dashboardUrl?: string
  internalApiBaseUrl?: string
  logLevel?: string
  regions?: {
    [key: string]: {
      apiBaseUrl?: string
      authUrl?: string
      dashboardUrl?: string
      internalApiBaseUrl?: string
    }
  }
}

// Cache for parsed configurations
const configCache = new Map<string, RuntimeConfig>()

/**
 * Detect runtime environment from Deno.env
 */
function detectEnvironment(): RuntimeEnvironment {
  const env = Deno.env.get('RUNTIME_ENV') ||
               Deno.env.get('NODE_ENV') ||
               Deno.env.get('DENO_ENV') ||
               'prod'

  const normalized = env.trim().toLowerCase()

  if (['sit', 'staging', 'test', 'dev', 'development'].includes(normalized)) {
    return 'sit'
  }

  return 'prod'
}

/**
 * Detect runtime region from Deno.env
 */
function detectRegion(): RuntimeRegion {
  const region = Deno.env.get('RUNTIME_REGION') ||
                 Deno.env.get('REGION') ||
                 'default'

  const normalized = region.trim().toLowerCase()

  if (normalized === 'cn' || normalized === 'china') {
    return 'cn'
  }

  if (normalized === 'global') {
    return 'global'
  }

  return 'default'
}

/**
 * Load and parse YAML configuration file
 */
async function loadYamlConfig(filename: string): Promise<YamlConfig> {
  try {
    const configPath = new URL(`../config/${filename}`, import.meta.url).pathname
    const content = await Deno.readTextFile(configPath)
    const parsed = yaml.load(content) as YamlConfig
    return parsed || {}
  } catch (error) {
    console.warn(`[runtime-config] Failed to load ${filename}:`, error)
    return {}
  }
}

/**
 * Merge configuration objects
 */
function mergeConfig(base: YamlConfig, override: YamlConfig): YamlConfig {
  return {
    ...base,
    ...override,
    // Don't merge regions - they're environment-specific
    regions: override.regions || base.regions,
  }
}

/**
 * Load runtime configuration based on environment and region
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const environment = detectEnvironment()
  const region = detectRegion()

  const cacheKey = `${environment}:${region}`

  // Return cached config if available
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey)!
  }

  console.info(`[runtime-config] Loading ${environment.toUpperCase()} environment, ${region} region`)

  // Load base configuration
  const baseConfig = await loadYamlConfig('runtime-service-config.base.yaml')

  // Load environment-specific configuration
  const envConfig = await loadYamlConfig(`runtime-service-config.${environment}.yaml`)

  // Merge base and environment configs
  let merged = mergeConfig(baseConfig, envConfig)

  // Apply region-specific overrides if applicable
  if (region !== 'default' && merged.regions && merged.regions[region]) {
    const regionOverrides = merged.regions[region]
    merged = {
      ...merged,
      ...regionOverrides,
    }
  }

  // Build final configuration with defaults
  const config: RuntimeConfig = {
    apiBaseUrl: merged.apiBaseUrl || 'https://api.svc.plus',
    authUrl: merged.authUrl || 'https://accounts.svc.plus',
    dashboardUrl: merged.dashboardUrl || 'https://console.svc.plus',
    internalApiBaseUrl: merged.internalApiBaseUrl,
    logLevel: (merged.logLevel as RuntimeConfig['logLevel']) || 'info',
    environment,
    region,
  }

  // Cache the configuration
  configCache.set(cacheKey, config)

  console.info(`[runtime-config] Loaded: authUrl=${config.authUrl}, apiBaseUrl=${config.apiBaseUrl}`)

  return config
}

/**
 * Get authentication service base URL
 */
export async function getAuthUrl(): Promise<string> {
  // Check environment variable override first
  const envOverride = Deno.env.get('AUTH_URL') || Deno.env.get('ACCOUNT_SERVICE_URL')
  if (envOverride) {
    return envOverride.trim().replace(/\/$/, '')
  }

  const config = await loadRuntimeConfig()
  return config.authUrl.replace(/\/$/, '')
}

/**
 * Get API service base URL
 */
export async function getApiBaseUrl(): Promise<string> {
  const envOverride = Deno.env.get('API_BASE_URL')
  if (envOverride) {
    return envOverride.trim().replace(/\/$/, '')
  }

  const config = await loadRuntimeConfig()
  return config.apiBaseUrl.replace(/\/$/, '')
}

/**
 * Get dashboard base URL
 */
export async function getDashboardUrl(): Promise<string> {
  const envOverride = Deno.env.get('DASHBOARD_URL')
  if (envOverride) {
    return envOverride.trim().replace(/\/$/, '')
  }

  const config = await loadRuntimeConfig()
  return config.dashboardUrl.replace(/\/$/, '')
}
