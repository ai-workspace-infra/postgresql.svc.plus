export const dynamic = 'error'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CATALOG, PROVIDERS } from '@lib/iac/catalog'
import type { CatalogItem, ProviderKey } from '@lib/iac/types'

import cloudIacIndex from '../../../../../public/_build/cloud_iac_index.json'
import { isFeatureEnabled } from '@lib/featureToggles'

import ServiceDetailView from '@components/iac/ServiceDetailView'

type PageParams = {
  provider: string
  service: string
}

type CloudIacIndex = {
  providers: { key: ProviderKey; label: string }[]
  services: { provider: ProviderKey; service: string }[]
}

const CLOUD_IAC_INDEX = cloudIacIndex as CloudIacIndex

const PROVIDER_MAP = new Map(PROVIDERS.map((provider) => [provider.key, provider.label] as const))

function findCategoryBySlug(provider: ProviderKey, slug: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.iac?.[provider]?.detailSlug === slug)
}

export function generateStaticParams() {
  return CLOUD_IAC_INDEX.services.map((item) => ({ provider: item.provider, service: item.service }))
}

export const dynamicParams = false

export const metadata: Metadata = {
  title: 'Cloud IaC Catalog',
}

export default function CloudIacServicePage({ params }: { params: PageParams }) {
  const providerKey = params.provider as ProviderKey
  const serviceSlug = params.service

  if (!isFeatureEnabled('appModules', `/cloud_iac/${providerKey}/${serviceSlug}`)) {
    notFound()
  }

  const providerLabel = PROVIDER_MAP.get(providerKey)
  if (!providerLabel) {
    notFound()
  }

  const category = findCategoryBySlug(providerKey, serviceSlug)
  if (!category) {
    notFound()
  }

  const integration = category.iac?.[providerKey]
  const productName = category.products[providerKey] ?? category.title

  return (
    <main className="px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <ServiceDetailView
          providerKey={providerKey}
          providerLabel={providerLabel}
          category={category}
          productName={productName}
          integration={integration}
        />
      </div>
    </main>
  )
}
