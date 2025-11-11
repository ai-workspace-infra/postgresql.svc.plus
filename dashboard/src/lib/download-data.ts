import type { DirListing } from '@lib/download/types'

export interface DownloadSection {
  key: string
  title: string
  href: string
  lastModified?: string
  count?: number
  root: string
}

function normalizeSegment(segment: string): string {
  return segment.replace(/\\/g, '/').trim().replace(/\/+$/g, '')
}

function normalizeSegments(segments: string[]): string[] {
  return segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => normalizeSegment(segment))
}

function toListingKey(segments: string[]): string {
  const normalized = normalizeSegments(segments).join('/')
  return normalized ? `${normalized}/` : ''
}

function normalizeListingPath(path: string): string {
  if (!path) {
    return ''
  }
  const cleaned = path.replace(/\\/g, '/').trim()
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`
}

export function formatSegmentLabel(segment: string): string {
  const cleaned = normalizeSegment(segment)
  return (
    cleaned
      .split(/[-_]/g)
      .filter(Boolean)
      .map((part) => (part.match(/^[a-z]+$/) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join(' ') || cleaned
  )
}

export function findListing(allListings: DirListing[], segments: string[]): DirListing | undefined {
  const key = toListingKey(segments)
  return allListings.find((listing) => normalizeListingPath(listing.path) === key)
}

export function countFiles(listing: DirListing, allListings: DirListing[]): number {
  const baseSegments = listing.path.split('/').filter(Boolean)
  return listing.entries.reduce((total, entry) => {
    if (entry.type === 'file') {
      return total + 1
    }
    if (entry.type === 'dir') {
      const child = findListing(allListings, [...baseSegments, entry.name])
      if (child) {
        return total + countFiles(child, allListings)
      }
    }
    return total
  }, 0)
}

export function buildSectionsForListing(
  listing: DirListing,
  allListings: DirListing[],
  baseSegments: string[],
): DownloadSection[] {
  return listing.entries
    .filter((entry) => entry.type === 'dir')
    .map((entry) => {
      const entrySegment = normalizeSegment(entry.name)
      const segments = [...baseSegments, entrySegment]
      const childListing = findListing(allListings, segments)
      return {
        key: segments.join('/'),
        title: formatSegmentLabel(entrySegment),
        href: `/download/${segments.join('/')}/`,
        lastModified: entry.lastModified,
        count: childListing ? countFiles(childListing, allListings) : undefined,
        root: baseSegments[0] ?? entrySegment,
      }
    })
}

export function buildDownloadSections(allListings: DirListing[]): Record<string, DownloadSection[]> {
  const rootListing = findListing(allListings, [])
  if (!rootListing) {
    return {}
  }

  const sectionsMap: Record<string, DownloadSection[]> = {}

  for (const entry of rootListing.entries) {
    if (entry.type !== 'dir') continue
    const entrySegment = normalizeSegment(entry.name)
    const rootSegments = [entrySegment]
    const key = rootSegments.join('/')
    const listing = findListing(allListings, rootSegments)
    if (!listing) {
      sectionsMap[entrySegment] = [
        {
          key,
          title: formatSegmentLabel(entrySegment),
          href: `/download/${key}/`,
          lastModified: entry.lastModified,
          root: entrySegment,
        },
      ]
      continue
    }

    const childSections = buildSectionsForListing(listing, allListings, rootSegments)
    const hasFiles = listing.entries.some((item) => item.type === 'file')
    if (childSections.length > 0) {
      sectionsMap[entrySegment] = hasFiles
        ? [
            {
              key,
              title: formatSegmentLabel(entrySegment),
              href: `/download/${key}/`,
              lastModified: entry.lastModified,
              count: countFiles(listing, allListings),
              root: entrySegment,
            },
            ...childSections,
          ]
        : childSections;
    } else {
      sectionsMap[entrySegment] = [
        {
          key,
          title: formatSegmentLabel(entrySegment),
          href: `/download/${key}/`,
          lastModified: entry.lastModified,
          count: countFiles(listing, allListings),
          root: entrySegment,
        },
      ]
    }
  }

  return sectionsMap
}
