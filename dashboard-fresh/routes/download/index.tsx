/**
 * Download Center Home - Fresh + Deno
 *
 * Download center landing page with summary and browser
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import { isFeatureEnabled } from '@/lib/featureToggles.ts'

import DownloadBrowser from '@/components/download/DownloadBrowser.tsx'
import DownloadSummary from '@/components/download/DownloadSummary.tsx'
import { buildDownloadSections, countFiles, findListing } from '@/lib/download-data.ts'
import { getDownloadListings } from '@/lib/download-manifest.ts'

interface DownloadHomeData {
  topLevelCount: number
  totalCollections: number
  totalFiles: number
  sectionsMap: ReturnType<typeof buildDownloadSections>
}

export const handler: Handlers<DownloadHomeData, FreshState> = {
  async GET(_req, ctx) {
    // Check if download module is enabled
    if (!isFeatureEnabled('appModules', '/download')) {
      return new Response('', {
        status: 404,
        statusText: 'Not Found',
      })
    }

    const allListings = getDownloadListings()
    const sectionsMap = buildDownloadSections(allListings)
    const rootListing = findListing(allListings, [])
    const topLevelDirectories = rootListing?.entries.filter((entry) => entry.type === 'dir') ?? []

    const totalCollections = Object.values(sectionsMap).reduce(
      (total, sections) => total + sections.length,
      0,
    )
    const totalFiles = topLevelDirectories.reduce((total, entry) => {
      const listing = findListing(allListings, [entry.name])
      return total + (listing ? countFiles(listing, allListings) : 0)
    }, 0)

    return ctx.render({
      topLevelCount: topLevelDirectories.length,
      totalCollections,
      totalFiles,
      sectionsMap,
    })
  },
}

export default function DownloadHome({ data }: PageProps<DownloadHomeData>) {
  const { topLevelCount, totalCollections, totalFiles, sectionsMap } = data

  return (
    <>
      <Head>
        <title>Download Center - Cloud-Neutral</title>
        <meta name="description" content="Download packages, tools and resources for Cloud-Neutral" />
      </Head>

      <main class="px-4 py-10 md:px-8">
        <div class="mx-auto max-w-7xl space-y-8">
          <DownloadSummary
            topLevelCount={topLevelCount}
            totalCollections={totalCollections}
            totalFiles={totalFiles}
          />
          <DownloadBrowser sectionsMap={sectionsMap} />
        </div>
      </main>
    </>
  )
}
