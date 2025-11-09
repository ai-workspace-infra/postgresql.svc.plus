'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import type { HeroContent, HeroSolution } from '@cms/content'
import HeroProductTabs from './HeroProductTabs'
import { useLanguage } from '@i18n/LanguageProvider'

const gradientOverlay = 'absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-blue-100/70'

type HeroBannerClientProps = {
  hero: HeroContent
  solutions: HeroSolution[]
}

export default function HeroBannerClient({ hero, solutions }: HeroBannerClientProps) {
  const { language } = useLanguage()
  const defaults = HERO_DEFAULTS[language]

  const heroCopy = useMemo(() => {
    const highlights = hero.highlights?.length ? hero.highlights : defaults.highlights
    return {
      eyebrow: hero.eyebrow ?? defaults.eyebrow,
      title: hero.title || defaults.title,
      subtitle: hero.subtitle ?? defaults.subtitle,
      highlights,
      bodyHtml: hero.bodyHtml || defaults.bodyHtml,
      primaryCtaLabel: hero.primaryCtaLabel ?? defaults.primaryCtaLabel,
      primaryCtaHref: hero.primaryCtaHref ?? defaults.primaryCtaHref,
      secondaryCtaLabel: hero.secondaryCtaLabel ?? defaults.secondaryCtaLabel,
      secondaryCtaHref: hero.secondaryCtaHref ?? defaults.secondaryCtaHref,
    }
  }, [defaults, hero])
  const fallback = defaults.panelFallback
  const highlightItems = heroCopy.highlights ?? []

  return (
    <section className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-200/60">
      <div className="absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_60%)]" />
      </div>
      <div className={gradientOverlay} aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 text-slate-900 sm:py-20 lg:flex-row lg:items-start lg:py-24">
        <div className="flex-1 space-y-6">
          {heroCopy.eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1 text-sm font-medium tracking-wide text-blue-700">
              {heroCopy.eyebrow}
            </span>
          ) : null}
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {heroCopy.title}
            </h1>
            {heroCopy.subtitle ? (
              <p className="text-base text-slate-700 sm:text-lg lg:text-xl">{heroCopy.subtitle}</p>
            ) : null}
          </div>
          {highlightItems.length ? (
            <ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 sm:text-base">
              {highlightItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {heroCopy.bodyHtml ? (
            <div
              className="prose max-w-none text-sm text-slate-800 sm:text-base"
              dangerouslySetInnerHTML={{ __html: heroCopy.bodyHtml }}
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {heroCopy.primaryCtaHref ? (
              <Link
                prefetch={false}
                href={heroCopy.primaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                {heroCopy.primaryCtaLabel}
              </Link>
            ) : null}
            {heroCopy.secondaryCtaHref ? (
              <Link
                prefetch={false}
                href={heroCopy.secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                {heroCopy.secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex-1">
          {solutions.length ? (
            <HeroProductTabs items={solutions} />
          ) : (
            <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-lg shadow-blue-100/60 backdrop-blur-sm sm:p-8 lg:p-10">
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{fallback.title}</h2>
              <p className="mt-3 text-sm text-slate-700 sm:text-base">{fallback.description}</p>
              {highlightItems.length ? (
                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  {highlightItems.slice(0, 4).map((item) => (
                    <div key={item} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-800">
                      {item}
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const HERO_DEFAULTS = {
  zh: {
    eyebrow: '产品概览',
    title: '统一的云原生控制台',
    subtitle: '此页面集中展示下载、部署和文档入口，便于快速查找技术资源。',
    highlights: [
      '覆盖自部署与托管两种交付方式',
      '权限模型支持多团队协作',
      '内置运维与可观测工具链',
      '所有能力均提供开放 API',
    ],
    bodyHtml:
      '<p>默认内容概述了平台的主要模块。结合下方的能力矩阵，可迅速了解每个方案的适配范围并跳转到详细文档。</p>',
    primaryCtaLabel: '查看下载',
    primaryCtaHref: '#download',
    secondaryCtaLabel: '查看文档',
    secondaryCtaHref: '#docs',
    panelFallback: {
      title: '方案概览',
      description: '当前尚未发布方案卡片，可在 CMS 中启用后查看详细能力列表。',
    },
  },
  en: {
    eyebrow: 'Product overview',
    title: 'Unified cloud-native console',
    subtitle: 'Access downloads, deployment guidance, and documentation links from one place.',
    highlights: [
      'Supports both self-hosted and managed delivery',
      'Role-based access for collaborative teams',
      'Operational tooling is available out of the box',
      'Every capability exposes open APIs for integration',
    ],
    bodyHtml:
      '<p>The default copy highlights core components of the platform. Combine it with the capability matrix to compare coverage and open relevant technical references.</p>',
    primaryCtaLabel: 'Go to downloads',
    primaryCtaHref: '#download',
    secondaryCtaLabel: 'View docs',
    secondaryCtaHref: '#docs',
    panelFallback: {
      title: 'Solution overview',
      description: 'Solution cards are not published yet. Enable entries in the CMS to review detailed capabilities.',
    },
  },
} satisfies Record<'zh' | 'en', {
  eyebrow: string
  title: string
  subtitle: string
  highlights: string[]
  bodyHtml: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  panelFallback: { title: string; description: string }
}>

