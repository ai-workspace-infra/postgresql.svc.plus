import type { DashboardExtension } from '../types'

import { userCenterExtension } from './user-center'

export const builtinExtensions: DashboardExtension[] = [userCenterExtension]
