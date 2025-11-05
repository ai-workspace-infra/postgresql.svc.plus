import type { DashboardExtension } from '../types'

import { userCenterExtension } from './user-center/index.ts'

export const builtinExtensions: DashboardExtension[] = [userCenterExtension]
