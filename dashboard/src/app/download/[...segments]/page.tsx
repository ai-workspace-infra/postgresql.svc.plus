export const dynamic = 'error'

import DownloadListingContent from '../../../components/download/DownloadListingContent'
import DownloadNotFound from '../../../components/download/DownloadNotFound'
import {
  buildSectionsForListing,
  countFiles,
  findListing,
  formatSegmentLabel,
} from '../../../lib/download-data'
import { getDownloadListings } from '../../../lib/download/dl-index-data-artifacts'
import type { DirListing } from '@lib/download/types'

async function getAllListings(): Promise<DirListing[]> {
  return getDownloadListings()
}

function collectDownloadParams(listings: DirListing[]): { segments: string[] }[] {
  const params: { segments: string[] }[] = []
  const root = findListing(listings, [])
  if (!root) {
    return params
  }

  const stack: { segments: string[]; listing: DirListing }[] = []
  stack.push({ segments: [], listing: root })

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) {
      continue
    }

    for (const entry of current.listing.entries) {
      if (entry.type !== 'dir') {
        continue
      }

      const segment = entry.name.replace(/\/+$/g, '').trim()
      if (!segment) {
        continue
      }

      const nextSegments = [...current.segments, segment]
      params.push({ segments: nextSegments })

      const child = findListing(listings, nextSegments)
      if (child) {
        stack.push({ segments: nextSegments, listing: child })
      }
    }
  }

  return params
}

export async function generateStaticParams() {
  const allListings = await getAllListings()
  return collectDownloadParams(allListings)
}

export const dynamicParams = false

function getLatestModified(listing: DirListing): string | undefined {
  let latest: string | undefined
  for (const entry of listing.entries) {
    if (entry.lastModified && (!latest || entry.lastModified > latest)) {
      latest = entry.lastModified
    }
  }
  return latest
}

export default async function DownloadListing({
  params,
}: {
  params: Promise<{ segments: string[] }>
}) {
  const { segments: rawSegments } = await params
  const segments = rawSegments
    .map((segment) => segment.trim().replace(/\/+$/g, ''))
    .filter((segment) => segment.length > 0)

  const allListings = await getAllListings()

  if (segments.length === 0) {
    return (
      <main className="px-4 py-10 md:px-8">
        <DownloadNotFound />
      </main>
    )
  }

  const listing = findListing(allListings, segments)

  if (!listing) {
    return (
      <main className="px-4 py-10 md:px-8">
        <DownloadNotFound />
      </main>
    )
  }

  const subdirectorySections = buildSectionsForListing(listing, allListings, segments)
  const fileEntries = listing.entries.filter((entry: DirListing['entries'][number]) => entry.type === 'file')
  const fileListing: DirListing = { path: listing.path, entries: fileEntries }

  const totalFiles = countFiles(listing, allListings)
  const latestModified = getLatestModified(listing)
  const displayTitle = formatSegmentLabel(segments[segments.length - 1] ?? '')
  const relativePath = segments.join('/')
  const remotePath = `https://dl.svc.plus/${listing.path}`

  return (
    <main className="px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <DownloadListingContent
          segments={segments}
          title={displayTitle}
          subdirectorySections={subdirectorySections}
          fileListing={fileListing}
          totalFiles={totalFiles}
          latestModified={latestModified}
          relativePath={relativePath}
          remotePath={remotePath}
        />
      </div>
    </main>
  )
}
