export const dynamic = 'error'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import Breadcrumbs, { type Crumb } from '../../../../components/download/Breadcrumbs'
import { getDocCollections, getDocResource, getDocCollectionsForBuildTime } from '../../resources.server'
import { isFeatureEnabled } from '@lib/featureToggles'
import DocCollectionView from './DocCollectionView'

function buildBreadcrumbs(
  slug: string,
  docTitle: string,
  version?: { label: string; slug?: string; id: string },
): Crumb[] {
  const crumbs: Crumb[] = [
    { label: 'Docs', href: '/docs' },
    { label: docTitle, href: `/docs/${slug}` },
  ]
  if (version) {
    const versionSlug = version.slug ?? version.id
    crumbs.push({ label: version.label, href: `/docs/${slug}/${versionSlug}` })
  }
  return crumbs
}

export const generateStaticParams = async () => {
  if (!isFeatureEnabled('appModules', '/docs')) {
    return []
  }

  // 构建时优先使用本地 fallback 数据，避免外部API调用
  const collections = await getDocCollectionsForBuildTime()
  const params: { collection: string; version: string }[] = []
  for (const doc of collections) {
    for (const version of doc.versions) {
      params.push({ collection: doc.slug, version: version.slug })
    }
  }
  return params
}

export const dynamicParams = false

export const metadata: Metadata = {
  title: 'Documentation',
}

export default async function DocVersionPage({
  params,
}: {
  params: { collection: string; version: string }
}) {
  if (!isFeatureEnabled('appModules', '/docs')) {
    notFound()
  }

  const doc = await getDocResource(params.collection)
  if (!doc) {
    notFound()
  }

  const activeVersion = doc.versions.find((item) => item.slug === params.version || item.id === params.version)
  if (!activeVersion) {
    notFound()
  }

  const breadcrumbs = buildBreadcrumbs(doc.slug, doc.title, activeVersion)

  return (
    <main className="px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Breadcrumbs items={breadcrumbs} />
        <DocCollectionView collection={doc} initialVersionId={activeVersion.id} />
      </div>
    </main>
  )
}
