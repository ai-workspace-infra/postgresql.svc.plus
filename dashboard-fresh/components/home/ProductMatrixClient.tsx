'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

import type { HeroSolution } from '@cms/content'
import { useLanguage } from '@i18n/LanguageProvider'

type ProductMatrixClientProps = {
  solutions: HeroSolution[]
}

export default function ProductMatrixClient({ solutions }: ProductMatrixClientProps) {
  const { language } = useLanguage()
  const copy = MATRIX_TEXT[language]
  const [activeIndex, setActiveIndex] = useState(0)

  const localizedSolutions = useMemo(
    () =>
      solutions.map((solution) => ({
        ...solution,
        features: solution.features ?? [],
      })),
    [solutions],
  )

  const activeSolution = useMemo(
    () => localizedSolutions[activeIndex] ?? localizedSolutions[0],
    [localizedSolutions, activeIndex],
  )

  if (!localizedSolutions.length || !activeSolution) {
    return null
  }

  const overviewHighlights = useMemo(() => {
    const collected = new Set<string>()
    for (const solution of localizedSolutions) {
      for (const feature of solution.features.slice(0, 2)) {
        if (collected.size >= 6) {
          break
        }
        collected.add(feature)
      }
    }
    const result = Array.from(collected)
    return result.length ? result : copy.highlights
  }, [copy.highlights, localizedSolutions])

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-brand-border bg-white p-8 text-brand-heading shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-8">
            <header className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-surface px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
                {copy.badge}
              </span>
              <h1 className="text-[30px] font-bold leading-tight text-brand sm:text-[34px] md:text-[36px]">
                {copy.title}
              </h1>
              <p className="text-sm text-brand-heading/80 sm:text-base lg:text-lg">{copy.description}</p>
            </header>
            <ul className="grid gap-2 text-sm text-brand-heading/80 sm:grid-cols-2 lg:grid-cols-3">
              {overviewHighlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand" aria-hidden />
                  <span className="leading-relaxed">{highlight}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{copy.topicsLabel}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {localizedSolutions.map((solution, index) => {
                  const isActive = index === activeIndex
                  return (
                    <button
                      key={solution.slug}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={clsx(
                        'flex min-w-[9rem] flex-1 items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand/40',
                        isActive
                          ? 'border-brand bg-brand/10 text-brand-heading shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
                          : 'border-brand-border bg-white text-brand-heading/80 hover:border-brand hover:bg-brand-surface',
                      )}
                    >
                      <span className="flex-1 text-brand-heading">{solution.title}</span>
                      <span
                        className={clsx(
                          'ml-2 text-xs font-medium transition',
                          isActive ? 'text-brand-heading/70' : 'text-brand-heading/60',
                        )}
                      >
                        {solution.tagline}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded-2xl border border-brand-border bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:p-8">
            <div className="space-y-4">
              {activeSolution.tagline ? (
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">{activeSolution.tagline}</p>
              ) : null}
              <h2 className="text-2xl font-semibold text-brand-navy sm:text-[26px]">{activeSolution.title}</h2>
              {activeSolution.description ? (
                <p className="text-sm text-brand-heading/80 sm:text-base">{activeSolution.description}</p>
              ) : null}
              {activeSolution.bodyHtml ? (
                <div
                  className="prose max-w-none text-sm text-brand-heading/90 [&_strong]:text-brand-navy"
                  dangerouslySetInnerHTML={{ __html: activeSolution.bodyHtml }}
                />
              ) : null}
            </div>
            {activeSolution.features.length ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">{copy.capabilitiesLabel}</p>
                <ul className="grid gap-2 text-sm text-brand-heading/80 sm:grid-cols-2">
                  {activeSolution.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" aria-hidden />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {getResourceLinks(activeSolution).length ? (
              <div className="space-y-2 pt-2 text-sm text-brand-heading/80">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">{copy.resourcesLabel}</p>
                <ul className="space-y-1">
                  {getResourceLinks(activeSolution).map(({ href, label }) => (
                    <li key={`${label}-${href}`}>
                      <Link prefetch={false} href={href} className="text-brand underline-offset-2 hover:underline">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

const MATRIX_TEXT = {
  zh: {
    badge: '能力矩阵',
    title: '各方案的适用场景与特性',
    description: '对比主要方案的核心能力，快速定位到适合的部署与集成路径。',
    highlights: [
      '统一访问控制与审计',
      '全栈观测与告警通道',
      '声明式交付与自动化运维',
      '开放的 API 与集成接口',
      '按需启用的模块化组件',
      '覆盖多云与本地环境',
    ],
    topicsLabel: '方案列表',
    capabilitiesLabel: '关键能力',
    resourcesLabel: '参考资料',
  },
  en: {
    badge: 'Capability matrix',
    title: 'Compare solution coverage and focus areas',
    description: 'Review key capabilities across solutions to pick the right deployment and integration path.',
    highlights: [
      'Unified access control and auditing',
      'End-to-end observability and alerting',
      'Declarative delivery with automated operations',
      'Open APIs for integrations',
      'Modular components activated on demand',
      'Support for multi-cloud and on-prem environments',
    ],
    topicsLabel: 'Solution list',
    capabilitiesLabel: 'Key capabilities',
    resourcesLabel: 'Reference material',
  },
} as const

function getResourceLinks(solution: HeroSolution) {
  const links = [
    solution.primaryCtaLabel && solution.primaryCtaHref
      ? { label: solution.primaryCtaLabel, href: solution.primaryCtaHref }
      : null,
    solution.secondaryCtaLabel && solution.secondaryCtaHref
      ? { label: solution.secondaryCtaLabel, href: solution.secondaryCtaHref }
      : null,
    solution.tertiaryCtaLabel && solution.tertiaryCtaHref
      ? { label: solution.tertiaryCtaLabel, href: solution.tertiaryCtaHref }
      : null,
  ]

  return links.filter((link): link is { label: string; href: string } => Boolean(link?.label && link.href))
}
