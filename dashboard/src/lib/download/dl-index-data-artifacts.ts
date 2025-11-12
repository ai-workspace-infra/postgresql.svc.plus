import 'server-only'

import type { DirListing } from '@lib/download/types'
import fallbackArtifacts from '../../../public/_build/artifacts-manifest.json'

const ARTIFACTS_MANIFEST_URL = 'https://dl.svc.plus/dl-index/artifacts-manifest.json'
const FALLBACK_LISTINGS_URL = 'https://dl.svc.plus/dl-index/offline-package-manifest.json'

async function fetchListings(url: string, useCache?: boolean): Promise<DirListing[]> {
  try {
    const response = await fetch(url, {
      // 运行时使用缓存策略，减少API调用
      next: useCache ? { revalidate: 3600 } : undefined,
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

async function loadDownloadListings(options?: { useCache?: boolean }): Promise<DirListing[]> {
  const manifestListings = await fetchListings(ARTIFACTS_MANIFEST_URL, options?.useCache)

  if (manifestListings.length > 0) {
    return manifestListings
  }

  const fallbackListings = await fetchListings(FALLBACK_LISTINGS_URL, options?.useCache)
  if (fallbackListings.length > 0) {
    return fallbackListings
  }

  // Last resort: use local fallback data
  return fallbackArtifacts as DirListing[]
}

// 构建时数据获取：优先使用本地 fallback 数据
async function loadDownloadListingsForBuildTime(): Promise<DirListing[]> {
  // 构建时优先使用本地数据，避免外部API调用导致构建失败
  const localFallback = fallbackArtifacts as DirListing[]

  if (localFallback.length > 0) {
    return localFallback
  }

  // fallback为空时，再尝试获取远程数据
  console.warn('Local fallback artifacts not found, attempting to fetch remote artifacts manifest...')
  const manifestListings = await fetchListings(ARTIFACTS_MANIFEST_URL, true)
  return manifestListings
}

export async function getDownloadListings(): Promise<DirListing[]> {
  return loadDownloadListings()
}

// 构建时获取：优先使用本地数据，保证构建成功
export async function getDownloadListingsForBuildTime(): Promise<DirListing[]> {
  return loadDownloadListingsForBuildTime()
}

export function clearDownloadListingsCache(): void {
  // Intentionally left blank. Runtime fetches always return fresh data.
}
