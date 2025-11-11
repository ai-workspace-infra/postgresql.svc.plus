'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

import ClientTime from '../../../components/ClientTime'
import DocViewSection, { type DocViewOption, type ViewMode } from './DocViewSection'
import { buildAbsoluteDocUrl } from '../../utils'
import type { DocCollection, DocResource } from '../../types'

interface DocCollectionViewProps {
  collection: DocCollection
  initialVersionId?: string
}

const buildViewerUrl = (
  rawUrl: string | undefined,
  _mode: ViewMode,
): { sourceUrl: string; viewerUrl: string } | null => {
  if (!rawUrl) {
    return null
  }
  const absoluteUrl = buildAbsoluteDocUrl(rawUrl) ?? rawUrl
  if (!absoluteUrl) {
    return null
  }
  return { sourceUrl: absoluteUrl, viewerUrl: absoluteUrl }
}

function buildViewOptions(resource?: DocResource): DocViewOption[] {
  if (!resource) {
    return []
  }
  const options: DocViewOption[] = []
  if (resource.pdfUrl) {
    const resolved = buildViewerUrl(resource.pdfUrl, 'pdf')
    if (resolved) {
      options.push({
        id: 'pdf',
        label: 'PDF',
        description: 'Best for printing and full fidelity diagrams.',
        url: resolved.sourceUrl,
        viewerUrl: resolved.viewerUrl,
        icon: 'pdf',
      })
    }
  }
  if (resource.htmlUrl) {
    const resolved = buildViewerUrl(resource.htmlUrl, 'html')
    if (resolved) {
      options.push({
        id: 'html',
        label: 'HTML',
        description: 'Responsive reader mode optimised for browsers.',
        url: resolved.sourceUrl,
        viewerUrl: resolved.viewerUrl,
        icon: 'html',
      })
    }
  }
  return options
}

export default function DocCollectionView({ collection, initialVersionId }: DocCollectionViewProps) {
  const { versions } = collection
  const router = useRouter()
  const defaultVersionId = collection.defaultVersionId ?? versions[0]?.id ?? ''
  const [activeVersionId, setActiveVersionId] = useState(initialVersionId ?? defaultVersionId)

  useEffect(() => {
    const nextId = initialVersionId ?? defaultVersionId
    setActiveVersionId((current) => {
      if (!nextId) {
        return ''
      }
      if (current === nextId) {
        return current
      }
      return nextId
    })
  }, [initialVersionId, defaultVersionId])

  useEffect(() => {
    if (!versions.length) {
      return
    }
    if (!versions.some((version) => version.id === activeVersionId)) {
      const fallback = versions.find((version) => version.id === defaultVersionId) ?? versions[0]
      if (fallback) {
        setActiveVersionId(fallback.id)
      }
    }
  }, [versions, activeVersionId, defaultVersionId])

  const activeVersion = useMemo(() => {
    if (!versions.length) return undefined
    return versions.find((version) => version.id === activeVersionId) ?? versions[0]
  }, [versions, activeVersionId])

  const activeResource = activeVersion?.resource
  const description = activeResource?.description || collection.description
  const tags = activeResource?.tags?.length ? activeResource.tags : collection.tags
  const viewOptions = useMemo(() => buildViewOptions(activeResource), [activeResource])
  const [isIntroCollapsed, setIsIntroCollapsed] = useState(false)

  if (!activeResource) {
    return (
      <section className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center text-sm text-gray-500">
        Documentation details are not available for this resource yet.
      </section>
    )
  }

  return (
    <>
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                  {collection.category || 'Documentation'}
                  {activeResource.version
                    ? ` • ${activeResource.version}`
                    : activeResource.variant
                      ? ` • ${activeResource.variant}`
                      : ''}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{collection.title}</h1>
              </div>
              <button
                type="button"
                onClick={() => setIsIntroCollapsed((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-purple-400 hover:text-purple-600"
              >
                {isIntroCollapsed ? (
                  <>
                    展开简介 <ChevronDown className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    收起简介 <ChevronUp className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {!isIntroCollapsed && (
              <div className="space-y-4 text-sm text-gray-600 md:text-base">
                <p className="max-w-3xl leading-relaxed">{description}</p>
                {(activeResource.variant || activeResource.language) && (
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {activeResource.variant && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">Release {activeResource.variant}</span>
                    )}
                    {activeResource.language && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">Language {activeResource.language}</span>
                    )}
                  </div>
                )}
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 text-sm text-gray-500 md:items-end">
            {versions.length > 1 && (
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 md:items-end">
                <span>Version</span>
                <select
                  value={activeVersionId}
                  onChange={(event) => {
                    const nextId = event.target.value
                    setActiveVersionId(nextId)
                    const target = versions.find((version) => version.id === nextId)
                    if (target) {
                      const targetSlug = target.slug || target.id
                      const currentSlug = activeVersion?.slug || activeVersion?.id
                      if (!currentSlug || currentSlug !== targetSlug) {
                        router.replace(`/docs/${collection.slug}/${targetSlug}`)
                      }
                    }
                  }}
                  className="w-full rounded-full border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 md:w-auto"
                >
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {activeResource.updatedAt && (
              <span suppressHydrationWarning>
                Updated <ClientTime isoString={activeResource.updatedAt} />
              </span>
            )}
            {activeResource.estimatedMinutes && <span>Approx. {activeResource.estimatedMinutes} minute read</span>}
            {activeVersion?.pathSegment && (
              <span className="text-xs text-gray-400">{activeVersion.pathSegment}</span>
            )}
          </div>
        </div>
      </section>

      <DocViewSection docTitle={collection.title} options={viewOptions} />
    </>
  )
}
