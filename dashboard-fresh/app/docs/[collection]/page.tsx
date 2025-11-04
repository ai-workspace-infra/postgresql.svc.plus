export const dynamic = 'error'

import { notFound, redirect } from 'next/navigation'

import { DOC_COLLECTIONS, getDocResource } from '../resources.server'
import { isFeatureEnabled } from '@lib/featureToggles'

export const dynamicParams = false

export const generateStaticParams = () => {
  if (!isFeatureEnabled('appModules', '/docs')) {
    return []
  }

  return DOC_COLLECTIONS.map((doc) => ({ collection: doc.slug }))
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
