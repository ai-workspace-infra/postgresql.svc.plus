'use client'

import { create } from 'zustand'

import {
  DEFAULT_INSIGHT_STATE,
  InsightState,
  serializeInsightState,
  deserializeInsightState
} from './urlState'

function getSegments(pathname: string): string[] {
  return pathname
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
}

function getBasePath(pathname: string): string {
  const segments = getSegments(pathname)
  const insightIndex = segments.indexOf('insight')
  if (insightIndex === -1) {
    return pathname || '/insight'
  }
  const relevant = segments.slice(0, insightIndex + 1)
  return `/${relevant.join('/')}`
}

function getShareIdFromSearch(search: string): string {
  if (!search) return ''
  const params = new URLSearchParams(search)
  return params.get('share') ?? ''
}

function encodeStateId(value: string): string {
  if (!value) return ''
  const base64 =
    typeof window !== 'undefined' && typeof window.btoa === 'function'
      ? window.btoa(value)
      : Buffer.from(value, 'utf-8').toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeStateId(value: string): string | null {
  if (!value) return null
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/')
    const padLength = (4 - (padded.length % 4)) % 4
    const base64 = padded + '='.repeat(padLength)
    return typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')
  } catch (error) {
    console.error('Failed to decode insight share identifier', error)
    return null
  }
}

function resolveBaseUrl() {
  if (typeof window !== 'undefined') {
    const { origin, pathname } = window.location
    const basePath = getBasePath(pathname)
    return `${origin}${basePath}`
  }
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) {
    const normalized = configured.endsWith('/') ? configured.slice(0, -1) : configured
    return normalized.endsWith('/insight') ? normalized : `${normalized}/insight`
  }
  return ''
}

type InsightStore = {
  state: InsightState
  shareableLink: string
  setInsight: (next: InsightState) => void
  updateInsight: (partial: Partial<InsightState>) => void
  hydrateFromURL: () => InsightState
  syncToURL: () => void
}

export const useInsightStore = create<InsightStore>((set, get) => ({
  state: DEFAULT_INSIGHT_STATE,
  shareableLink: '',
  setInsight: (next) => set({ state: next }),
  updateInsight: (partial) =>
    set((current) => ({
      state: {
        ...current.state,
        ...partial,
      },
    })),
  hydrateFromURL: () => {
    if (typeof window === 'undefined') {
      return get().state
    }
    const shareId = getShareIdFromSearch(window.location.search)
    if (shareId) {
      const decoded = decodeStateId(shareId)
      if (decoded) {
        const hydrated = deserializeInsightState(decoded)
        set({ state: hydrated })
        return hydrated
      }
    }

    const hydrated = deserializeInsightState(window.location.hash)
    set({ state: hydrated })
    return hydrated
  },
  syncToURL: () => {
    if (typeof window === 'undefined') {
      set({ shareableLink: resolveBaseUrl() })
      return
    }

    const serializedState = serializeInsightState(get().state)
    const encoded = encodeStateId(serializedState)
    const currentUrl = new URL(window.location.href)
    const basePath = getBasePath(currentUrl.pathname)
    if (currentUrl.pathname !== basePath) {
      currentUrl.pathname = basePath
    }
    if (encoded) {
      currentUrl.searchParams.set('share', encoded)
    } else {
      currentUrl.searchParams.delete('share')
    }
    if (!currentUrl.searchParams.toString()) {
      currentUrl.search = ''
    }
    if (currentUrl.hash) {
      currentUrl.hash = ''
    }
    const nextUrl = currentUrl.toString()
    if (nextUrl !== window.location.href) {
      window.history.replaceState({}, '', nextUrl)
    }

    const baseUrl = resolveBaseUrl()
    set({ shareableLink: encoded ? `${baseUrl}?share=${encoded}` : baseUrl })
  },
}))

if (typeof window !== 'undefined') {
  useInsightStore.getState().hydrateFromURL()
  useInsightStore.subscribe(
    (storeState, prevState) => {
      if (!prevState || storeState.state === prevState.state) return
      useInsightStore.getState().syncToURL()
    },
  )
  useInsightStore.getState().syncToURL()
}
