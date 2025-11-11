import type { RuntimeEnvironment, RuntimeRegion } from '../server/runtime-loader'

type RuntimeEnvGlobal = {
  environment?: unknown
  region?: unknown
}

export type ClientRuntimeEnv = {
  environment: RuntimeEnvironment
  region: RuntimeRegion
}

export type ClientRuntimeEnvSettings = ClientRuntimeEnv & {
  detectedBy: string
}

const DEFAULT_ENVIRONMENT: RuntimeEnvironment = 'prod'
const DEFAULT_REGION: RuntimeRegion = 'default'

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

export function readClientRuntimeEnvSettings(): ClientRuntimeEnvSettings {
  if (typeof window === 'undefined') {
    return {
      environment: DEFAULT_ENVIRONMENT,
      region: DEFAULT_REGION,
      detectedBy: 'client-default',
    }
  }

  const globalCandidate = (window as typeof window & { __XCONTROL_RUNTIME_ENV__?: RuntimeEnvGlobal })
    .__XCONTROL_RUNTIME_ENV__
  const environmentFromGlobal = normalizeEnvironmentValue(globalCandidate?.environment)
  const regionFromGlobal = normalizeRegionValue(globalCandidate?.region)

  if (environmentFromGlobal) {
    return {
      environment: environmentFromGlobal,
      region: regionFromGlobal ?? DEFAULT_REGION,
      detectedBy: 'window.__XCONTROL_RUNTIME_ENV__',
    }
  }

  const environmentFromEnv = normalizeEnvironmentValue(process.env.NEXT_PUBLIC_RUNTIME_ENVIRONMENT)
  const regionFromEnv = normalizeRegionValue(process.env.NEXT_PUBLIC_RUNTIME_REGION)

  const detectedBy = environmentFromEnv
    ? 'client-env'
    : regionFromEnv
      ? 'client-region-env'
      : 'client-default'

  return {
    environment: environmentFromEnv ?? DEFAULT_ENVIRONMENT,
    region: regionFromEnv ?? DEFAULT_REGION,
    detectedBy,
  }
}

export function readClientRuntimeEnv(): ClientRuntimeEnv {
  const { environment, region } = readClientRuntimeEnvSettings()
  return { environment, region }
}
