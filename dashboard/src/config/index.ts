import 'server-only'

import { loadRuntimeConfig } from '../server/runtime-loader'

export type { RuntimeConfig, RuntimeEnvironment, RuntimeRegion } from '../server/runtime-loader'

export { loadRuntimeConfig }

export const runtimeConfig = loadRuntimeConfig()
