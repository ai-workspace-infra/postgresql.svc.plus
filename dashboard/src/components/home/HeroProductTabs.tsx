'use client'

import Link from 'next/link'
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'

import type { HeroSolution } from '@lib/marketingContent'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'

const ROTATION_INTERVAL_MS = 8000

type HeroProductTabsProps = {
  items: HeroSolution[]
}

export default function HeroProductTabs({ items }: HeroProductTabsProps) {
  const { language } = useLanguage()
  const marketing = translations[language].marketing.home
  const [activeIndex, setActiveIndex] = useState(0)
  const tablistId = useId()

  const localizedItems = useMemo(() => {
    const overrides = marketing.solutionOverrides ?? {}
    return items.map((item) => {
      const override = overrides[item.slug]
      if (!override) {
        return item
      }
      return {
        ...item,
        title: override.title ?? item.title,
        tagline: override.tagline ?? item.tagline,
        description: override.description ?? item.description,
        features:
          override.features && override.features.length ? override.features : item.features,
        bodyHtml: override.bodyHtml ?? item.bodyHtml,
        primaryCtaLabel: override.primaryCtaLabel ?? item.primaryCtaLabel,
        secondaryCtaLabel: override.secondaryCtaLabel ?? item.secondaryCtaLabel,
        tertiaryCtaLabel: override.tertiaryCtaLabel ?? item.tertiaryCtaLabel,
      }
    })
  }, [items, marketing.solutionOverrides])

  useEffect(() => {
    if (localizedItems.length <= 1) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => {
        const nextIndex = current + 1
        return nextIndex >= localizedItems.length ? 0 : nextIndex
      })
    }, ROTATION_INTERVAL_MS)

    return () => window.clearTimeout(timer)
  }, [activeIndex, localizedItems.length])

  const activeItem = localizedItems[activeIndex] ?? localizedItems[0]

  const panelId = useMemo(() => {
    if (!activeItem) {
      return undefined
    }
    return `${tablistId}-panel-${activeItem.slug}`
  }, [activeItem, tablistId])

  if (!localizedItems.length || !activeItem) {
    return null
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (localizedItems.length <= 1) {
      return
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(index === localizedItems.length - 1 ? 0 : index + 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(index === 0 ? localizedItems.length - 1 : index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(localizedItems.length - 1)
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 text-slate-900 shadow-xl shadow-blue-200/60 sm:p-8">
      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-700">{marketing.tabsLabel}</span>
      <div
        id={tablistId}
        role="tablist"
        aria-label={marketing.tabsAriaLabel}
        className="mt-4 flex flex-wrap gap-2"
      >
        {localizedItems.map((item, index) => {
          const isActive = index === activeIndex
          const tabId = `${tablistId}-tab-${item.slug}`
          const targetPanelId = `${tablistId}-panel-${item.slug}`
          return (
            <button
              key={item.slug}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={targetPanelId}
              className={`group flex min-w-[9rem] flex-col rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${
                isActive
                  ? 'border-blue-400 bg-blue-100 text-slate-900 shadow-lg shadow-blue-300/40'
                  : 'border-blue-100 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'
              }`}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="text-base font-semibold leading-tight">{item.title}</span>
              {item.tagline ? (
                <span
                  className={`mt-1 text-xs font-medium transition ${
                    isActive ? 'text-slate-800/80' : 'text-slate-500'
                  }`}
                >
                  {item.tagline}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={`${tablistId}-tab-${activeItem.slug}`}
        className="mt-6 flex flex-1 flex-col rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-inner shadow-blue-100/70 sm:p-7"
      >
        <div className="flex flex-col gap-2">
          {activeItem.tagline ? (
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-700">
              {activeItem.tagline}
            </p>
          ) : null}
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{activeItem.title}</h2>
          {activeItem.description ? (
            <p className="text-sm text-slate-700 sm:text-base">{activeItem.description}</p>
          ) : null}
        </div>
        {activeItem.features.length ? (
          <ul className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 sm:text-base">
            {activeItem.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2"
              >
                <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" aria-hidden />
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {activeItem.bodyHtml ? (
          <div
            className="prose mt-5 max-w-none text-sm text-slate-800 [&_strong]:text-slate-900"
            dangerouslySetInnerHTML={{ __html: activeItem.bodyHtml }}
          />
        ) : null}
        {(activeItem.primaryCtaLabel && activeItem.primaryCtaHref) ||
        (activeItem.secondaryCtaLabel && activeItem.secondaryCtaHref) ||
        (activeItem.tertiaryCtaLabel && activeItem.tertiaryCtaHref) ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {activeItem.primaryCtaLabel && activeItem.primaryCtaHref ? (
              <Link
                prefetch={false}
                href={activeItem.primaryCtaHref}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-300/50 transition hover:bg-blue-700"
              >
                {activeItem.primaryCtaLabel}
              </Link>
            ) : null}
            {activeItem.secondaryCtaLabel && activeItem.secondaryCtaHref ? (
              <Link
                prefetch={false}
                href={activeItem.secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                {activeItem.secondaryCtaLabel}
              </Link>
            ) : null}
            {activeItem.tertiaryCtaLabel && activeItem.tertiaryCtaHref ? (
              <Link
                prefetch={false}
                href={activeItem.tertiaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-blue-100 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/70"
              >
                {activeItem.tertiaryCtaLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
