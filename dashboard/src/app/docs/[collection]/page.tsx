export const dynamic = 'error'

import { notFound, redirect } from 'next/navigation'

import { getDocCollections, getDocResource } from '../resources.server'
import { isFeatureEnabled } from '@lib/featureToggles'

export const dynamicParams = false

export const generateStaticParams = async () => {
  if (!isFeatureEnabled('appModules', '/docs')) {
    return []
  }

  const collections = await getDocCollections()
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
