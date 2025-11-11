export const dynamic = 'error'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import CloudIacCatalog from '@components/iac/CloudIacCatalog'
import { CATALOG, PROVIDERS } from '@lib/iac/catalog'
import type { ProviderKey } from '@lib/iac/types'

import cloudIacIndex from '../../../../public/_build/cloud_iac_index.json'
import { isFeatureEnabled } from '@lib/featureToggles'

type PageParams = {
  provider: string
}

type CloudIacIndex = {
  providers: { key: ProviderKey; label: string }[]
}

const CLOUD_IAC_INDEX = cloudIacIndex as CloudIacIndex

const PROVIDER_MAP = new Map(PROVIDERS.map((provider) => [provider.key, provider.label] as const))

export function generateStaticParams() {
  return CLOUD_IAC_INDEX.providers.map((provider) => ({ provider: provider.key }))
}

export const dynamicParams = false

export const metadata: Metadata = {
  title: 'Cloud IaC Catalog',
}

export default function CloudIacProviderPage({ params }: { params: PageParams }) {
  const providerKey = params.provider as ProviderKey

  if (!isFeatureEnabled('appModules', `/cloud_iac/${providerKey}`)) {
    notFound()
  }
  if (!PROVIDER_MAP.has(providerKey)) {
    notFound()
  }

  const providerLabel = PROVIDER_MAP.get(providerKey)!

  return (
    <main className="px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">{providerLabel} Catalog</p>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">核心服务目录</h1>
          <p className="max-w-3xl text-sm text-gray-600 md:text-base">
            浏览 {providerLabel} 提供的计算、网络、负载均衡、存储、数据库、缓存、队列、容器服务、数据服务、安全防护以及身份与访问管理能力，点击卡片进入服务详情配置 IaC 与 GitOps。
          </p>
        </header>

        <CloudIacCatalog catalog={CATALOG} providers={PROVIDERS} mode="provider" activeProvider={providerKey} />
      </div>
    </main>
  )
}
