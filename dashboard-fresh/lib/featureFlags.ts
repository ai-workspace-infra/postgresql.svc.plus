export interface FeatureFlagDefinition {
  id: string
  title: string
  description?: string
  envVar?: string
  defaultEnabled?: boolean
}

export interface FeatureFlag extends FeatureFlagDefinition {
  enabled: boolean
}

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on', 'enable', 'enabled'])
const FALSY_VALUES = new Set(['0', 'false', 'no', 'off', 'disable', 'disabled'])

function parseFlagValue(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback
  }

  const normalized = value.trim().toLowerCase()
  if (TRUTHY_VALUES.has(normalized)) {
    return true
  }
  if (FALSY_VALUES.has(normalized)) {
    return false
  }
  return fallback
}

export function createFeatureFlag(definition: FeatureFlagDefinition): FeatureFlag {
  const { defaultEnabled = false, envVar } = definition

  const env: Record<string, string | undefined> =
    typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {}

  const envValue = envVar ? env[envVar] : undefined
  const enabled = parseFlagValue(envValue, defaultEnabled)

  return {
    ...definition,
    defaultEnabled,
    enabled,
  }
}

export function isFeatureEnabled(flag: FeatureFlag | FeatureFlagDefinition): boolean {
  if ('enabled' in flag) {
    return flag.enabled
  }

  return createFeatureFlag(flag).enabled
}
