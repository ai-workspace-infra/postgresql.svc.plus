import { afterEach, describe, expect, it } from 'vitest'

import {
  getExtensionRegistry,
  resetExtensionRegistryCache,
  resolveExtensionRouteComponent,
} from '@extensions/loader'

const AGENT_FLAG = 'NEXT_PUBLIC_FEATURE_AGENT_MODULE'

afterEach(() => {
  delete process.env[AGENT_FLAG]
  resetExtensionRegistryCache()
})

describe('extension loader', () => {
  it('disables agent module when feature flag is off', async () => {
    process.env[AGENT_FLAG] = '0'
    resetExtensionRegistryCache()

    const registry = getExtensionRegistry()
    const agentRoute = registry.getRoute('/panel/agent')

    expect(agentRoute?.enabled).toBe(false)
    await expect(resolveExtensionRouteComponent('/panel/agent')).rejects.toThrow('disabled')

    const panelRoute = registry.getRoute('/panel')
    expect(panelRoute?.enabled).toBe(true)
    const PanelComponent = await resolveExtensionRouteComponent('/panel')
    expect(typeof PanelComponent).toBe('function')
  })

  it('enables agent module when feature flag is on', async () => {
    process.env[AGENT_FLAG] = '1'
    resetExtensionRegistryCache()

    const registry = getExtensionRegistry()
    const agentRoute = registry.getRoute('/panel/agent')

    expect(agentRoute?.enabled).toBe(true)

    const AgentComponent = await resolveExtensionRouteComponent('/panel/agent')
    expect(typeof AgentComponent).toBe('function')
  })
})
