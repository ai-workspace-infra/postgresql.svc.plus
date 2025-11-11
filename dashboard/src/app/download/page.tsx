export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'

import DownloadBrowser from '../../components/download/DownloadBrowser'
import DownloadSummary from '../../components/download/DownloadSummary'
import { buildDownloadSections, countFiles, findListing } from '../../lib/download-data'
import { getDownloadListings } from '../../lib/download/dl-index-data-artifacts'
import { getOfflinePackageSections, getOfflinePackageFileCount } from '../../lib/download/dl-index-data-offline-package'
import type { DirEntry } from '../../../../types/download'
import { isFeatureEnabled } from '@lib/featureToggles'

export default async function DownloadHome() {
  if (!isFeatureEnabled('appModules', '/download')) {
    notFound()
  }

  // Get data from multiple sources
  const allListings = await getDownloadListings()
  const offlinePackageSections = await getOfflinePackageSections()

  // Merge sections - offline-package takes priority
  const sectionsMap = buildDownloadSections(allListings)
  const mergedSectionsMap = { ...sectionsMap, ...offlinePackageSections }

  const rootListing = findListing(allListings, [])
  const topLevelDirectories = rootListing?.entries.filter((entry: DirEntry) => entry.type === 'dir') ?? []

  // Get file count from offline-package if available
  const offlinePackageFileCount = await getOfflinePackageFileCount()

  const totalCollections = Object.values(mergedSectionsMap).reduce((total, sections) => total + sections.length, 0)
  const totalFiles = topLevelDirectories.reduce((total: number, entry: DirEntry) => {
    const listing = findListing(allListings, [entry.name])
    return total + (listing ? countFiles(listing, allListings) : 0)
  }, 0) + offlinePackageFileCount

  return (
    <main className="px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <DownloadSummary
          topLevelCount={topLevelDirectories.length}
          totalCollections={totalCollections}
          totalFiles={totalFiles}
        />
        <DownloadBrowser sectionsMap={mergedSectionsMap} />
      </div>
    </main>
  )
}
