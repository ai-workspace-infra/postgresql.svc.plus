import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

import type { AccessRule } from '@lib/accessControl'
import type { FeatureFlag, FeatureFlagDefinition } from '@lib/featureFlags'

export type RouteMatchStrategy = 'exact' | 'startsWith'

export interface ExtensionMeta {
  title: string
  description?: string
  version?: string
  author?: string
  keywords?: string[]
}

export interface ExtensionStoreRegistration {
  id: string
  register: () => Promise<void> | void
}

export interface ExtensionMenuItem {
  section: string
  order?: number
  badge?: string
  hidden?: boolean
}

export interface ExtensionRoute {
  path: string
  label: string
  description?: string
  icon?: LucideIcon
  loader: () => Promise<{ default: ComponentType<any> }>
  match?: RouteMatchStrategy
  guard?: AccessRule
  sidebar?: ExtensionMenuItem
  featureFlag?: FeatureFlagDefinition
  redirect?: {
    unauthenticated?: string
    forbidden?: string
  }
}

export interface DashboardExtension {
  id: string
  meta: ExtensionMeta
  routes: ExtensionRoute[]
  stores?: ExtensionStoreRegistration[]
  featureFlag?: FeatureFlagDefinition
}

export interface RegisteredRoute extends ExtensionRoute {
  extensionId: string
  extension: RegisteredExtension
  enabled: boolean
  featureFlag?: FeatureFlag
}

export interface RegisteredExtension extends DashboardExtension {
  enabled: boolean
  featureFlag?: FeatureFlag
  routes: RegisteredRoute[]
}

export interface SidebarItem {
  route: RegisteredRoute
  disabled: boolean
}

export interface SidebarSection {
  id: string
  title: string
  order?: number
  items: SidebarItem[]
}

export interface ExtensionRegistry {
  extensions: RegisteredExtension[]
  routes: RegisteredRoute[]
  sidebar: SidebarSection[]
  getRoute: (path: string) => RegisteredRoute | undefined
  resolveComponent: (path: string) => Promise<ComponentType<any>>
}
