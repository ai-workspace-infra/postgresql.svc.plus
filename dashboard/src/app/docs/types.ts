export interface DocResource {
  slug: string
  title: string
  description: string
  category?: string
  version?: string
  updatedAt?: string
  pdfUrl?: string
  htmlUrl?: string
  tags?: string[]
  estimatedMinutes?: number
  coverImage?: string
  language?: string
  variant?: string
  versionSlug?: string
  pathSegments?: string[]
  collection?: string
  collectionSlug?: string
  collectionLabel?: string
}

export interface DocVersionOption {
  id: string
  label: string
  resource: DocResource
  slug: string
  pathSegment?: string
}

export interface DocCollection {
  slug: string
  title: string
  description: string
  category?: string
  updatedAt?: string
  estimatedMinutes?: number
  tags: string[]
  latestVersionLabel?: string
  latestVariant?: string
  versions: DocVersionOption[]
  defaultVersionId?: string
  defaultVersionSlug?: string
  directory?: string
}
