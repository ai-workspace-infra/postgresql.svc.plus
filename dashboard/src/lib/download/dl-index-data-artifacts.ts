import 'server-only'

import type { DirListing } from '@lib/download/types'
import fallbackArtifacts from '../../../public/_build/artifacts-manifest.json'

const ARTIFACTS_MANIFEST_URL = 'https://dl.svc.plus/dl-index/artifacts-manifest.json'
const FALLBACK_LISTINGS_URL = 'https://dl.svc.plus/dl-index/offline-package-manifest.json'

async function fetchListings(url: string): Promise<DirListing[]> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? (data as DirListing[]) : []
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error)
    return []
  }
}

async function loadDownloadListings(): Promise<DirListing[]> {
  const manifestListings = await fetchListings(ARTIFACTS_MANIFEST_URL)

  if (manifestListings.length > 0) {
    return manifestListings
  }

  const fallbackListings = await fetchListings(FALLBACK_LISTINGS_URL)
  if (fallbackListings.length > 0) {
    return fallbackListings
  }

  // Last resort: use local fallback data
  return fallbackArtifacts as DirListing[]
}

export async function getDownloadListings(): Promise<DirListing[]> {
  return loadDownloadListings()
}

export function clearDownloadListingsCache(): void {
  // Intentionally left blank. Runtime fetches always return fresh data.
}
