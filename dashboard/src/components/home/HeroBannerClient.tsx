'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import type { HeroContent, HeroSolution } from '@lib/marketingContent'
import HeroProductTabs from './HeroProductTabs'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'

const gradientOverlay = 'absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-blue-100/70'

type HeroBannerClientProps = {
  hero: HeroContent
  solutions: HeroSolution[]
}

function mergeHeroCopy(hero: HeroContent, override: MarketingHeroCopy) {
  return {
    ...hero,
    eyebrow: override.eyebrow ?? hero.eyebrow,
    title: override.title ?? hero.title,
    subtitle: override.subtitle ?? hero.subtitle,
    highlights:
      override.highlights && override.highlights.length ? override.highlights : hero.highlights,
    bodyHtml: override.bodyHtml ?? hero.bodyHtml,
    primaryCtaLabel: override.primaryCtaLabel ?? hero.primaryCtaLabel,
    secondaryCtaLabel: override.secondaryCtaLabel ?? hero.secondaryCtaLabel,
  }
}

type MarketingHeroCopy = {
  eyebrow?: string
  title?: string
  subtitle?: string
  highlights?: string[]
  bodyHtml?: string
  primaryCtaLabel?: string
  secondaryCtaLabel?: string
}

export default function HeroBannerClient({ hero, solutions }: HeroBannerClientProps) {
  const { language } = useLanguage()
  const marketing = translations[language].marketing.home

  const heroCopy = useMemo(() => mergeHeroCopy(hero, marketing.hero), [hero, marketing.hero])
  const fallback = marketing.heroFallback
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
            {hero.primaryCtaLabel && hero.primaryCtaHref ? (
              <Link
                prefetch={false}
                href={hero.primaryCtaHref}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-300/60 transition hover:bg-blue-700"
              >
                {heroCopy.primaryCtaLabel ?? hero.primaryCtaLabel}
              </Link>
            ) : null}
            {hero.secondaryCtaLabel && hero.secondaryCtaHref ? (
              <Link
                prefetch={false}
                href={hero.secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                {heroCopy.secondaryCtaLabel ?? hero.secondaryCtaLabel}
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

