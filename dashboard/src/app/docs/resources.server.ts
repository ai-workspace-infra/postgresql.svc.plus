import 'server-only'

import { isFeatureEnabled } from '@lib/featureToggles'
import fallbackDocsIndex from '../../../public/_build/docs_index.json'

import { buildAbsoluteDocUrl } from './utils'
import type { DocCollection, DocResource, DocVersionOption } from './types'

const DOCS_MANIFEST_URL = 'https://dl.svc.plus/dl-index/docs-manifest.json'

interface RawDocResource {
  slug?: unknown
  title?: unknown
  description?: unknown
  category?: unknown
  version?: unknown
  updatedAt?: unknown
  pdfUrl?: unknown
  htmlUrl?: unknown
  tags?: unknown
  estimatedMinutes?: unknown
  coverImage?: unknown
  language?: unknown
  variant?: unknown
  versionSlug?: unknown
  pathSegments?: unknown
  collection?: unknown
  collectionSlug?: unknown
  collectionLabel?: unknown
}

async function fetchDocs(): Promise<RawDocResource[]> {
  try {
    const response = await fetch(DOCS_MANIFEST_URL, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch docs manifest: ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? (data as RawDocResource[]) : []
  } catch (error) {
    console.error('Error fetching docs manifest:', error)
    return []
  }
}

async function loadDocs(): Promise<RawDocResource[]> {
  const manifestDocs = await fetchDocs()

  if (manifestDocs.length > 0) {
    return manifestDocs
  }

  const fallbackDocs = Array.isArray(fallbackDocsIndex) ? (fallbackDocsIndex as RawDocResource[]) : []
  return fallbackDocs
}

async function getRawDocs(): Promise<RawDocResource[]> {
  return loadDocs()
}

async function buildDocsDataset(): Promise<DocResource[]> {
  const rawDocs = await getRawDocs()
  return rawDocs.map((item) => normalizeResource(item as RawDocResource)).filter(
    (item): item is DocResource => item !== null,
  )
}

export async function getDocsDataset(): Promise<DocResource[]> {
  return buildDocsDataset()
}

export function clearDocsCache(): void {
  // Intentionally left blank. Runtime fetches always return fresh data.
}


function slugifySegment(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || value.toLowerCase().replace(/\s+/g, '-') || 'doc'
}

function humanizeSegment(value: string): string {
  if (!value) return ''
  const withSpaces = value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  const normalized = withSpaces.replace(/\s+/g, ' ').trim()
  if (!normalized) return value
  return normalized
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseUpdatedAt(value?: string): number {
  if (!value) return 0
  const ts = Date.parse(value)
  return Number.isNaN(ts) ? 0 : ts
}

interface CollectionAccumulator {
  directory: string
  slug: string
  label: string
  docs: DocResource[]
}

function buildCollections(docs: DocResource[]): DocCollection[] {
  const map = new Map<string, CollectionAccumulator>()
  const usedSlugs = new Set<string>()

  const ensureUniqueSlug = (slug: string) => {
    let candidate = slug || 'doc'
    if (!usedSlugs.has(candidate)) {
      usedSlugs.add(candidate)
      return candidate
    }
    let counter = 2
    while (usedSlugs.has(`${candidate}-${counter}`)) {
      counter += 1
    }
    const unique = `${candidate}-${counter}`
    usedSlugs.add(unique)
    return unique
  }

  for (const doc of docs) {
    const directory = doc.collection ?? doc.pathSegments?.[0] ?? doc.category ?? doc.slug
    if (!directory) {
      continue
    }
    if (directory === 'all.json' || directory === 'dir.json') {
      continue
    }

    const slug = doc.collectionSlug ?? slugifySegment(directory)
    const label = doc.collectionLabel ?? doc.category ?? humanizeSegment(directory)
    const key = directory
    const existing = map.get(key)
    if (existing) {
      existing.docs.push(doc)
      continue
    }

    map.set(key, {
      directory,
      slug: ensureUniqueSlug(slug),
      label,
      docs: [doc],
    })
  }

  const collections: DocCollection[] = []
  for (const accumulator of map.values()) {
    const docsSorted = [...accumulator.docs].sort((a, b) => parseUpdatedAt(b.updatedAt) - parseUpdatedAt(a.updatedAt))
    const primary = docsSorted[0]
    if (!primary) {
      continue
    }

    const tagSet = new Set<string>()
    for (const doc of docsSorted) {
      if (!doc.tags) continue
      for (const tag of doc.tags) {
        if (tag) tagSet.add(tag)
      }
    }

    const versionSlugSet = new Set<string>()
    const ensureUniqueVersionSlug = (slug: string) => {
      let candidate = slug || 'version'
      if (!versionSlugSet.has(candidate)) {
        versionSlugSet.add(candidate)
        return candidate
      }
      let counter = 2
      while (versionSlugSet.has(`${candidate}-${counter}`)) {
        counter += 1
      }
      const unique = `${candidate}-${counter}`
      versionSlugSet.add(unique)
      return unique
    }

    const versions: DocVersionOption[] = docsSorted.map((doc) => {
      const labelParts: string[] = []
      if (doc.version) {
        labelParts.push(doc.version)
      }
      if (!doc.version && doc.variant) {
        labelParts.push(doc.variant)
      }
      if (doc.language && !labelParts.includes(doc.language)) {
        labelParts.push(doc.language)
      }
      const label = labelParts.length > 0 ? labelParts.join(' • ') : doc.title
      let versionSlug = doc.versionSlug
      if (!versionSlug || !versionSlug.trim()) {
        const candidate = doc.variant ?? doc.version ?? doc.slug
        versionSlug = slugifySegment(candidate)
      }
      versionSlug = ensureUniqueVersionSlug(versionSlug)
      return {
        id: doc.slug,
        label,
        resource: doc,
        slug: versionSlug,
        pathSegment: doc.pathSegments?.[1],
      }
    })

    const collection: DocCollection = {
      slug: accumulator.slug,
      title: primary.title,
      description: primary.description,
      category: primary.category ?? accumulator.label,
      updatedAt: primary.updatedAt,
      estimatedMinutes: primary.estimatedMinutes,
      tags: Array.from(tagSet).sort((a, b) => a.localeCompare(b)),
      latestVersionLabel: versions[0]?.label,
      latestVariant: primary.variant,
      versions,
      defaultVersionId: versions[0]?.id,
      defaultVersionSlug: versions[0]?.slug,
      directory: accumulator.directory,
    }

    collections.push(collection)
  }

  return collections.sort((a, b) => parseUpdatedAt(b.updatedAt) - parseUpdatedAt(a.updatedAt))
}

async function buildDocsCollections(): Promise<DocCollection[]> {
  const docs = await getDocsDataset()
  return buildCollections(docs)
}

export async function getDocCollections(): Promise<DocCollection[]> {
  return buildDocsCollections()
}

export function clearCollectionsCache(): void {
  clearDocsCache()
}

function normalizeResource(item: RawDocResource): DocResource | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const slug = typeof item.slug === 'string' ? item.slug : undefined
  const title = typeof item.title === 'string' ? item.title : undefined
  if (!slug || !title) {
    return null
  }

  const resource: DocResource = {
    slug,
    title,
    description: typeof item.description === 'string' ? item.description : '',
  }

  if (typeof item.category === 'string' && item.category.trim()) {
    resource.category = item.category
  }
  if (typeof item.version === 'string' && item.version.trim()) {
    resource.version = item.version
  }
  if (typeof item.updatedAt === 'string' && item.updatedAt.trim()) {
    resource.updatedAt = item.updatedAt
  }
  if (typeof item.pdfUrl === 'string' && item.pdfUrl.trim()) {
    resource.pdfUrl = buildAbsoluteDocUrl(item.pdfUrl) ?? item.pdfUrl
  }
  if (typeof item.htmlUrl === 'string' && item.htmlUrl.trim()) {
    resource.htmlUrl = buildAbsoluteDocUrl(item.htmlUrl) ?? item.htmlUrl
  }
  if (typeof item.language === 'string' && item.language.trim()) {
    resource.language = item.language
  }
  if (typeof item.variant === 'string' && item.variant.trim()) {
    resource.variant = item.variant
  }
  if (typeof item.versionSlug === 'string' && item.versionSlug.trim()) {
    resource.versionSlug = item.versionSlug
  }
  if (typeof item.collection === 'string' && item.collection.trim()) {
    resource.collection = item.collection
  }
  if (typeof item.collectionSlug === 'string' && item.collectionSlug.trim()) {
    resource.collectionSlug = item.collectionSlug
  }
  if (typeof item.collectionLabel === 'string' && item.collectionLabel.trim()) {
    resource.collectionLabel = item.collectionLabel
  }
  if (typeof item.estimatedMinutes === 'number' && !Number.isNaN(item.estimatedMinutes)) {
    resource.estimatedMinutes = item.estimatedMinutes
  }
  if (typeof item.coverImage === 'string' && item.coverImage.trim()) {
    resource.coverImage = item.coverImage
  }
  if (Array.isArray(item.tags)) {
    const tags = item.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    if (tags.length > 0) {
      resource.tags = [...new Set(tags)]
    }
  }
  if (Array.isArray(item.pathSegments)) {
    const segments = item.pathSegments.filter((segment): segment is string => typeof segment === 'string' && segment.trim().length > 0)
    if (segments.length > 0) {
      resource.pathSegments = segments
    }
  }

  if (!resource.description.trim()) {
    const context: string[] = []
    if (resource.category) {
      context.push(resource.category)
    }
    if (resource.version) {
      context.push(`edition ${resource.version}`)
    } else if (resource.variant) {
      context.push(`release ${resource.variant}`)
    }
    const formats: string[] = []
    if (resource.pdfUrl) formats.push('PDF')
    if (resource.htmlUrl) formats.push('HTML')
    if (formats.length > 0) {
      context.push(`available as ${formats.join(' and ')}`)
    }
    const suffix = context.length > 0 ? ` (${context.join(', ')})` : ''
    resource.description = `${resource.title}${suffix}.`
  }

  return resource
}

const isDocsModuleEnabled = () => isFeatureEnabled('appModules', '/docs')

export async function getDocResources(): Promise<DocCollection[]> {
  if (!isDocsModuleEnabled()) {
    return []
  }

  return getDocCollections()
}

export async function getDocResource(slug: string): Promise<DocCollection | undefined> {
  if (!isDocsModuleEnabled()) {
    return undefined
  }

  const collections = await getDocCollections()
  return collections.find((doc) => doc.slug === slug)
}
