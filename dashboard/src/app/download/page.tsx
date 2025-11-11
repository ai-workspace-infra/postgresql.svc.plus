export const dynamic = 'error'

import { notFound } from 'next/navigation'

import DownloadBrowser from '../../components/download/DownloadBrowser'
import DownloadSummary from '../../components/download/DownloadSummary'
import { buildDownloadSections, countFiles, findListing } from '../../lib/download-data'
import { getDownloadListings } from '../../lib/download-manifest'
import type { DirEntry } from '../../../../types/download'
import { isFeatureEnabled } from '@lib/featureToggles'

export default function DownloadHome() {
  if (!isFeatureEnabled('appModules', '/download')) {
    notFound()
  }

  const allListings = getDownloadListings()
  const sectionsMap = buildDownloadSections(allListings)
  const rootListing = findListing(allListings, [])
  const topLevelDirectories = rootListing?.entries.filter((entry: DirEntry) => entry.type === 'dir') ?? []

  const totalCollections = Object.values(sectionsMap).reduce((total, sections) => total + sections.length, 0)
  const totalFiles = topLevelDirectories.reduce((total, entry) => {
    const listing = findListing(allListings, [entry.name])
    return total + (listing ? countFiles(listing, allListings) : 0)
  }, 0)

  return (
    <main className="px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <DownloadSummary
          topLevelCount={topLevelDirectories.length}
          totalCollections={totalCollections}
          totalFiles={totalFiles}
        />
        <DownloadBrowser sectionsMap={sectionsMap} />
      </div>
    </main>
  )
}
