import { loadRuntimeConfig } from './runtime-loader'

export type { RuntimeConfig, RuntimeEnvironment, RuntimeRegion } from './runtime-loader'

export { loadRuntimeConfig }

export const runtimeConfig = loadRuntimeConfig()
