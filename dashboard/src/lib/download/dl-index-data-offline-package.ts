import type { DirListing } from './types'
import { buildDownloadSections, countFiles, findListing, formatSegmentLabel, type DownloadSection } from '../download-data'
import fallbackOfflinePackage from '../../../public/_build/offline-package.json'

const OFFLINE_PACKAGE_URL = 'https://dl.svc.plus/dl-index/offline-package-manifest.json'

/**
 * Fetch the offline-package download listings
 */
export async function fetchOfflinePackageListings(): Promise<DirListing[]> {
  try {
    const response = await fetch(OFFLINE_PACKAGE_URL, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch offline-package data: ${response.statusText}`)
    }

    const data: DirListing[] = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching offline-package listings:', error)
    // Return local fallback data
    return fallbackOfflinePackage as DirListing[]
  }
}

/**
 * Retrieve offline-package listings on demand.
 * Data is fetched dynamically so updates are reflected without a deploy.
 */
export async function getOfflinePackageListings(): Promise<DirListing[]> {
  return fetchOfflinePackageListings()
}

/**
 * Build download sections specifically for offline-package
 */
export async function getOfflinePackageSections(): Promise<Record<string, DownloadSection[]>> {
  const listings = await getOfflinePackageListings()
  
  // Extract just the offline-package listings
  const offlinePackageListings = listings.filter(
    listing => listing.path === 'offline-package/' || listing.path.startsWith('offline-package/')
  )
  
  if (offlinePackageListings.length === 0) {
    return {}
  }
  
  // Build sections using the existing function
  return buildDownloadSections(offlinePackageListings)
}

/**
 * Get total file count for offline-package
 */
export async function getOfflinePackageFileCount(): Promise<number> {
  const listings = await getOfflinePackageListings()
  const rootListing = findListing(listings, ['offline-package'])
  
  if (!rootListing) {
    return 0
  }
  
  return countFiles(rootListing, listings)
}

/**
 * Clear the cache (useful for testing or when data might have changed)
 */
export function clearOfflinePackageCache(): void {
  // Intentionally left blank. Runtime fetches always return fresh data.
}
