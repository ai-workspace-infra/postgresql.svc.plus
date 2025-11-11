import featureToggleData from '../config/feature-toggles.json'

export type ReleaseChannel = 'stable' | 'beta' | 'develop'

export type FeatureToggleNode = {
  enabled?: boolean
  channel?: ReleaseChannel
  children?: Record<string, FeatureToggleNode>
}

const featureToggles = featureToggleData as {
  globalNavigation: FeatureToggleNode
  appModules: FeatureToggleNode
  cmsExperience: FeatureToggleNode
}

export type FeatureToggleSection = keyof typeof featureToggles

const DYNAMIC_SEGMENT_PATTERN = /^\[(\.\.\.)?.+\]$/

const normalizeSegments = (pathname: string = '') =>
  pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)

const findDynamicChildKey = (children: Record<string, FeatureToggleNode>) =>
  Object.keys(children).find((key) => DYNAMIC_SEGMENT_PATTERN.test(key))

type ResolveResult = {
  enabled: boolean
  node?: FeatureToggleNode
}

const resolveToggleNode = (node: FeatureToggleNode | undefined, segments: string[]): ResolveResult => {
  if (!node) {
    return { enabled: true }
  }

  const isEnabled = node.enabled !== false
  if (!isEnabled) {
    return { enabled: false, node }
  }

  if (segments.length === 0) {
    return { enabled: true, node }
  }

  const children = node.children || {}
  const [current, ...rest] = segments
  const exactChild = children[current]
  const dynamicChildKey = findDynamicChildKey(children)
  const wildcardChild = children['*']
  const nextNode = exactChild ?? (dynamicChildKey ? children[dynamicChildKey] : undefined) ?? wildcardChild

  if (!nextNode) {
    return { enabled: true, node }
  }

  return resolveToggleNode(nextNode, rest)
}

const resolveSection = (section: FeatureToggleSection, pathname: string): ResolveResult => {
  const tree = featureToggles[section]
  if (!tree) {
    return { enabled: true }
  }

  const segments = normalizeSegments(pathname)
  return resolveToggleNode(tree, segments)
}

export const isFeatureEnabled = (section: FeatureToggleSection, pathname: string) =>
  resolveSection(section, pathname).enabled

export const getFeatureToggleInfo = (
  section: FeatureToggleSection,
  pathname: string,
): { enabled: boolean; channel?: ReleaseChannel } => {
  const result = resolveSection(section, pathname)
  return {
    enabled: result.enabled,
    channel: result.node?.channel,
  }
}

export const getFeatureToggleTree = () => featureToggles
