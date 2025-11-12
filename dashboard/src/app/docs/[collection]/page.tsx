export const dynamic = 'error'

import { notFound, redirect } from 'next/navigation'

import { getDocCollections, getDocResource, getDocCollectionsForBuildTime } from '../resources.server'
import { isFeatureEnabled } from '@lib/featureToggles'

export const dynamicParams = false

export const generateStaticParams = async () => {
  if (!isFeatureEnabled('appModules', '/docs')) {
    return []
  }

  // 构建时优先使用本地 fallback 数据，避免外部API调用
  const collections = await getDocCollectionsForBuildTime()
  return collections.map((doc) => ({ collection: doc.slug }))
}

export default async function CollectionPage({
  params,
}: {
  params: { collection: string }
}) {
  if (!isFeatureEnabled('appModules', '/docs')) {
    notFound()
  }

  const doc = await getDocResource(params.collection)
  if (!doc) {
    notFound()
  }

  const defaultVersion = doc.versions.find((version) => version.id === doc.defaultVersionId) ?? doc.versions[0]
  if (!defaultVersion) {
    notFound()
  }

  redirect(`/docs/${doc.slug}/${defaultVersion.slug}`)
}
