'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'

import type { CatalogItem, ProviderDefinition, ProviderKey } from '@lib/iac/types'

type OverviewProps = {
  mode?: 'overview'
  activeProvider?: undefined
}

type ProviderProps = {
  mode: 'provider'
  activeProvider: ProviderKey
}

type CloudIacCatalogProps = {
  catalog: CatalogItem[]
  providers: readonly ProviderDefinition[]
} & (OverviewProps | ProviderProps)

function buildSearchPool(
  item: CatalogItem,
  providers: readonly ProviderDefinition[],
  isProviderMode: boolean,
  activeProvider?: ProviderKey,
) {
  const values = [item.title, item.subtitle, item.description, ...item.highlights]

  if (isProviderMode && activeProvider) {
    const product = item.products[activeProvider]
    if (product) values.push(product)
  } else {
    providers.forEach((provider) => {
      const product = item.products[provider.key]
      if (product) values.push(product)
    })
  }

  const base = values
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase())
  if (!item.iac) {
    return base
  }

  const integrationValues = Object.values(item.iac).flatMap((integration) =>
    integration ? [integration.githubWorkflow, integration.gitlabPipeline] : [],
  )

  const sanitized = integrationValues
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase())

  return base.concat(sanitized)
}

function ProviderBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
      {label}
    </span>
  )
}

export default function CloudIacCatalog(props: CloudIacCatalogProps) {
  const { catalog, providers } = props
  const isProviderMode = props.mode === 'provider'
  const activeProvider = isProviderMode ? props.activeProvider : undefined

  const providerKeys = useMemo(() => providers.map((provider) => provider.key), [providers])
  const [selectedProviders, setSelectedProviders] = useState<ProviderKey[]>(providerKeys)
  useEffect(() => {
    setSelectedProviders(providerKeys)
  }, [providerKeys])
  const [searchTerm, setSearchTerm] = useState('')

  const selectedProviderSet = useMemo(() => new Set(selectedProviders), [selectedProviders])
  const isAllSelected = selectedProviders.length === providerKeys.length

  function toggleProvider(key: ProviderKey) {
    setSelectedProviders((previous) => {
      const isSelected = previous.includes(key)
      if (isSelected) {
        if (previous.length === 1) {
          return providerKeys
        }
        return previous.filter((item) => item !== key)
      }

      const nextSet = new Set(previous)
      nextSet.add(key)
      return providers.filter((provider) => nextSet.has(provider.key)).map((provider) => provider.key)
    })
  }

  const filteredCatalog = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return catalog.filter((item) => {
      if (isProviderMode) {
        if (activeProvider && !item.products[activeProvider]) {
          return false
        }
      } else if (!isAllSelected) {
        const matchesProvider = selectedProviders.some((provider) => Boolean(item.products[provider]))
        if (!matchesProvider) {
          return false
        }
      }

      if (!query) {
        return true
      }

      const pool = buildSearchPool(item, providers, isProviderMode, activeProvider)
      return pool.some((value) => value.includes(query))
    })
  }, [
    catalog,
    providers,
    searchTerm,
    selectedProviders,
    isAllSelected,
    isProviderMode,
    activeProvider,
  ])

  const totalCategories = catalog.length
  const matchedCategories = filteredCatalog.length

  const selectedProviderLabel = useMemo(() => {
    if (isProviderMode) {
      const provider = providers.find((item) => item.key === activeProvider)
      return provider?.label ?? '未知云厂商'
    }
    if (isAllSelected) {
      return '全部云厂商'
    }
    const labels = providers
      .filter((provider) => selectedProviderSet.has(provider.key))
      .map((provider) => provider.label)
    return labels.join('、') || '全部云厂商'
  }, [providers, isProviderMode, activeProvider, isAllSelected, selectedProviderSet])

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-6">
        {!isProviderMode && (
          <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">云厂商筛选</h2>
            <p className="mt-1 text-sm text-gray-500">在总览中聚焦某个云厂商或查看全局矩阵。</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedProviders(providerKeys)}
                aria-pressed={isAllSelected}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isAllSelected
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部云厂商
              </button>
              {providers.map((provider) => (
                <button
                  key={provider.key}
                  type="button"
                  onClick={() => toggleProvider(provider.key)}
                  aria-pressed={selectedProviderSet.has(provider.key)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    selectedProviderSet.has(provider.key)
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">搜索服务</h2>
          <p className="mt-1 text-sm text-gray-500">
            {isProviderMode
              ? '支持按服务名称或关键能力过滤当前云厂商的核心服务。'
              : '支持按产品名称、服务描述或关键能力进行检索。'}
          </p>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={isProviderMode ? '搜索云服务' : '搜索产品或能力'}
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </section>
      </aside>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">核心服务类别</h2>
            <p className="text-sm text-gray-500">
              已匹配 {matchedCategories} / {totalCategories} 类服务 · 当前视图：{selectedProviderLabel}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            Cloud IaC · 服务编排目录
          </span>
        </div>

        {filteredCatalog.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/60 p-12 text-center text-sm text-gray-500">
            未找到匹配的服务，请调整搜索关键词或切换视图。
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCatalog.map((item) => {
              if (isProviderMode && !activeProvider) {
                return null
              }

              const integration = isProviderMode && activeProvider ? item.iac?.[activeProvider] : null
              const productName = isProviderMode && activeProvider ? item.products[activeProvider] : null

              return (
                <article
                  key={`${item.key}${isProviderMode ? `-${activeProvider}` : ''}`}
                  className="flex h-full flex-col gap-5 rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <header className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">{item.subtitle}</p>
                    {isProviderMode && productName ? (
                      <h3 className="text-2xl font-semibold text-gray-900">{productName}</h3>
                    ) : (
                      <h3 className="text-2xl font-semibold text-gray-900">{item.title}</h3>
                    )}
                  </header>

                  <p className="text-sm text-gray-600">{item.description}</p>

                  <ul className="space-y-2 text-sm text-gray-600">
                    {item.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-400" aria-hidden="true" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  {isProviderMode && activeProvider ? (
                    <div className="mt-auto space-y-3">
                      {integration ? (
                        <Link
                          href={`/cloud_iac/${activeProvider}/${integration.detailSlug}`}
                          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                          查看服务详情
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 px-4 py-3 text-xs text-gray-500">
                          该服务暂未配置 IaC 集成，敬请期待。
                        </div>
                      )}

                      {productName && (
                        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                          <ProviderBadge label={selectedProviderLabel} />
                          <span>{productName}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-auto space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">厂商对照</p>
                      <div className="flex flex-wrap gap-2">
                        {(isAllSelected ? providers : providers.filter((provider) => selectedProviderSet.has(provider.key))).map((provider) => {
                          const product = item.products[provider.key]
                          if (!product) {
                            return null
                          }
                          return (
                            <Link
                              key={provider.key}
                              href={`/cloud_iac/${provider.key}`}
                              className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                            >
                              <span>{provider.label}</span>
                              <span className="hidden sm:inline text-gray-400 group-hover:text-purple-500">{product}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-purple-500" aria-hidden="true" />
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
