
import { useMemo } from 'preact/hooks'
import Breadcrumbs, { type Crumb } from './Breadcrumbs.tsx'
import CardGrid from './CardGrid.tsx'
import FileTable from './FileTable.tsx'
import { useLanguage } from '@i18n/LanguageProvider.tsx'
import { translations } from '@i18n/translations.ts'
import { formatDate } from '@lib/format.ts'
import { formatSegmentLabel, type DownloadSection } from '@lib/download-data.ts'
import type { DirListing } from '../../types/download.ts'

type DownloadListingContentProps = {
  segments: string[]
  title: string
  subdirectorySections: DownloadSection[]
  fileListing: DirListing
  totalFiles: number
  latestModified?: string
  relativePath: string
  remotePath: string
}

function formatCount(
  templates: { singular: string; plural: string },
  count: number,
  locale: string,
): string {
  const template = count === 1 ? templates.singular : templates.plural
  return template.replace('{{count}}', count.toLocaleString(locale))
}

export default function DownloadListingContent({
  segments,
  title,
  subdirectorySections,
  fileListing,
  totalFiles,
  latestModified,
  relativePath,
  remotePath,
}: DownloadListingContentProps) {
  const { language } = useLanguage()
  const locale = language === 'zh' ? 'zh-CN' : 'en-US'
  const t = translations[language].download

  const breadcrumbItems = useMemo<Crumb[]>(() => {
    const crumbs: Crumb[] = [{ label: t.breadcrumbRoot, href: '/download' }]
    segments.forEach((segment, index) => {
      const hrefSegments = segments.slice(0, index + 1)
      crumbs.push({
        label: formatSegmentLabel(segment),
        href: `/download/${hrefSegments.join('/')}`,
      })
    })
    return crumbs
  }, [segments, t.breadcrumbRoot])

  const description = t.listing.headingDescription.replace('{{directory}}', title)
  const entryCountLabel = formatCount(t.listing.collectionsCount, subdirectorySections.length, locale)
  const stats = [
    {
      label: t.listing.stats.subdirectories,
      value: subdirectorySections.length.toLocaleString(locale),
    },
    {
      label: t.listing.stats.files,
      value: totalFiles.toLocaleString(locale),
    },
    ...(latestModified
      ? [
          {
            label: t.listing.stats.lastUpdated,
            value: formatDate(latestModified, locale),
          },
        ]
      : []),
  ]

  const hasSubdirectories = subdirectorySections.length > 0
  const hasFiles = fileListing.entries.length > 0

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <article className="rounded-3xl border bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm text-gray-600">{description}</p>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label}>
                  <dt className="text-gray-500">{item.label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          {hasSubdirectories && (
            <article className="rounded-3xl border bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{t.listing.collectionsTitle}</h2>
                <span className="text-xs text-gray-500">{entryCountLabel}</span>
              </div>
              <CardGrid sections={subdirectorySections} />
            </article>
          )}

          {hasFiles && (
            <article className="rounded-3xl border bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <FileTable listing={fileListing} breadcrumb={breadcrumbItems} showBreadcrumbs={false} />
            </article>
          )}

          {!hasSubdirectories && !hasFiles && (
            <div className="rounded-3xl border border-dashed p-10 text-center text-sm text-gray-500">
              {t.listing.empty}
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <article className="rounded-3xl border bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">{t.listing.infoTitle}</h2>
            <dl className="mt-4 space-y-3 text-xs text-gray-600">
              <div>
                <dt className="text-gray-500">{t.listing.infoPath}</dt>
                <dd className="mt-1 font-mono text-sm text-gray-900">
                  /{relativePath || segments.join('/')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{t.listing.infoSource}</dt>
                <dd className="mt-1 text-sm">
                  <a
                    href={remotePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    {remotePath}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-gray-500">{t.listing.infoNotice}</p>
          </article>
        </aside>
      </div>
    </div>
  )
}
