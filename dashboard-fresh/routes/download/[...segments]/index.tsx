/**
 * Download Listing - Fresh + Deno
 *
 * Dynamic download listing page for specific paths
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'

import DownloadListingContent from '@/components/download/DownloadListingContent.tsx'
import DownloadNotFound from '@/components/download/DownloadNotFound.tsx'
import {
  buildSectionsForListing,
  countFiles,
  findListing,
  formatSegmentLabel,
} from '@/lib/download-data.ts'
import { getDownloadListings } from '@/lib/download-manifest.ts'
import type { DirListing } from '@/types/download.ts'

interface DownloadListingData {
  found: boolean
  segments: string[]
  title?: string
  subdirectorySections?: any[]
  fileListing?: DirListing
  totalFiles?: number
  latestModified?: string
  relativePath?: string
  remotePath?: string
}

function getLatestModified(listing: DirListing): string | undefined {
  let latest: string | undefined
  for (const entry of listing.entries) {
    if (entry.lastModified && (!latest || entry.lastModified > latest)) {
      latest = entry.lastModified
    }
  }
  return latest
}

export const handler: Handlers<DownloadListingData, FreshState> = {
  async GET(_req, ctx) {
    const allListings = getDownloadListings()
    const rawSegments = ctx.params.segments ? ctx.params.segments.split('/') : []

    const segments = rawSegments
      .map((segment) => segment.trim().replace(/\/+$/g, ''))
      .filter((segment) => segment.length > 0)

    // Empty segments means root redirect
    if (segments.length === 0) {
      return ctx.render({
        found: false,
        segments: [],
      })
    }

    const listing = findListing(allListings, segments)

    // Listing not found
    if (!listing) {
      return ctx.render({
        found: false,
        segments,
      })
    }

    const subdirectorySections = buildSectionsForListing(listing, allListings, segments)
    const fileEntries = listing.entries.filter((entry) => entry.type === 'file')
    const fileListing: DirListing = { path: listing.path, entries: fileEntries }

    const totalFiles = countFiles(listing, allListings)
    const latestModified = getLatestModified(listing)
    const displayTitle = formatSegmentLabel(segments[segments.length - 1] ?? '')
    const relativePath = segments.join('/')
    const remotePath = `https://dl.svc.plus/${listing.path}`

    return ctx.render({
      found: true,
      segments,
      title: displayTitle,
      subdirectorySections,
      fileListing,
      totalFiles,
      latestModified,
      relativePath,
      remotePath,
    })
  },
}

export default function DownloadListing({ data }: PageProps<DownloadListingData>) {
  const {
    found,
    segments,
    title,
    subdirectorySections,
    fileListing,
    totalFiles,
    latestModified,
    relativePath,
    remotePath,
  } = data

  if (!found) {
    return (
      <>
        <Head>
          <title>Download Not Found - Cloud-Neutral</title>
        </Head>
        <main class="px-4 py-10 md:px-8">
          <DownloadNotFound />
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{title} - Download - Cloud-Neutral</title>
        <meta name="description" content={`Download ${title} packages and resources`} />
      </Head>

      <main class="px-4 py-10 md:px-8">
        <div class="mx-auto max-w-7xl">
          <DownloadListingContent
            segments={segments}
            title={title!}
            subdirectorySections={subdirectorySections!}
            fileListing={fileListing!}
            totalFiles={totalFiles!}
            latestModified={latestModified}
            relativePath={relativePath!}
            remotePath={remotePath!}
          />
        </div>
      </main>
    </>
  )
}
