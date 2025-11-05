import { createFeatureFlag } from '@lib/featureFlags.ts'

import { builtinExtensions } from './builtin/index.ts'
import type {
  DashboardExtension,
  ExtensionRegistry,
  RegisteredExtension,
  RegisteredRoute,
  SidebarItem,
  SidebarSection,
} from './types'

let registryCache: ExtensionRegistry | undefined

function instantiateExtension(definition: DashboardExtension): RegisteredExtension {
  const extensionFlag = definition.featureFlag ? createFeatureFlag(definition.featureFlag) : undefined
  const extensionEnabled = extensionFlag ? extensionFlag.enabled : true

  const registered: RegisteredExtension = {
    ...definition,
    featureFlag: extensionFlag,
    enabled: extensionEnabled,
    routes: [],
  }

  registered.routes = definition.routes.map((route) => {
    const routeFlag = route.featureFlag ? createFeatureFlag(route.featureFlag) : undefined
    const routeEnabled = extensionEnabled && (routeFlag ? routeFlag.enabled : true)

    const registeredRoute: RegisteredRoute = {
      ...route,
      extensionId: definition.id,
      extension: registered,
      enabled: routeEnabled,
      featureFlag: routeFlag,
    }

    return registeredRoute
  })

  return registered
}

function buildSidebar(routes: RegisteredRoute[]): SidebarSection[] {
  const sectionMap = new Map<string, SidebarSection>()

  routes.forEach((route) => {
    if (!route.sidebar || route.sidebar.hidden) {
      return
    }

    const { section, order } = route.sidebar
    const sectionId = section
    let entry = sectionMap.get(sectionId)
    if (!entry) {
      entry = { id: sectionId, title: section, order, items: [] }
      sectionMap.set(sectionId, entry)
    }

    const item: SidebarItem = {
      route,
      disabled: !route.enabled,
    }

    entry.items.push(item)
  })

  const sortedSections = Array.from(sectionMap.values()).sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) {
      return orderA - orderB
    }
    return a.title.localeCompare(b.title, 'zh-CN')
  })

  sortedSections.forEach((section) => {
    section.items.sort((a, b) => {
      const orderA = a.route.sidebar?.order ?? Number.MAX_SAFE_INTEGER
      const orderB = b.route.sidebar?.order ?? Number.MAX_SAFE_INTEGER
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return a.route.label.localeCompare(b.route.label, 'zh-CN')
    })
  })

  return sortedSections
}

function createRegistry(): ExtensionRegistry {
  const extensions = builtinExtensions.map(instantiateExtension)
  const routes = extensions.flatMap((extension) => extension.routes)
  const routeMap = new Map<string, RegisteredRoute>()

  routes.forEach((route) => {
    if (!routeMap.has(route.path)) {
      routeMap.set(route.path, route)
    }
  })

  const sidebar = buildSidebar(routes)

  return {
    extensions,
    routes,
    sidebar,
    getRoute: (path: string) => routeMap.get(path),
    resolveComponent: async (path: string) => {
      const route = routeMap.get(path)
      if (!route) {
        throw new Error(`No extension route registered for path: ${path}`)
      }
      if (!route.enabled) {
        throw new Error(`Extension route is disabled: ${path}`)
      }
      const module = await route.loader()
      return module.default
    },
  }
}

export function getExtensionRegistry(): ExtensionRegistry {
  if (!registryCache) {
    registryCache = createRegistry()
  }
  return registryCache
}

export async function resolveExtensionRouteComponent(path: string) {
  const registry = getExtensionRegistry()
  return registry.resolveComponent(path)
}

export function resetExtensionRegistryCache() {
  registryCache = undefined
}
