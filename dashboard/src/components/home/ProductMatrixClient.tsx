'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

import type { HeroSolution } from '@lib/marketingContent'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'

type ProductMatrixClientProps = {
  solutions: HeroSolution[]
}

export default function ProductMatrixClient({ solutions }: ProductMatrixClientProps) {
  const { language } = useLanguage()
  const marketing = translations[language].marketing.home
  const [activeIndex, setActiveIndex] = useState(0)

  const localizedSolutions = useMemo(() => {
    const overrides = marketing.solutionOverrides ?? {}
    return solutions.map((solution) => {
      const override = overrides[solution.slug]
      if (!override) {
        return solution
      }
      return {
        ...solution,
        title: override.title ?? solution.title,
        tagline: override.tagline ?? solution.tagline,
        description: override.description ?? solution.description,
        features:
          override.features && override.features.length ? override.features : solution.features,
        bodyHtml: override.bodyHtml ?? solution.bodyHtml,
        primaryCtaLabel: override.primaryCtaLabel ?? solution.primaryCtaLabel,
        secondaryCtaLabel: override.secondaryCtaLabel ?? solution.secondaryCtaLabel,
        tertiaryCtaLabel: override.tertiaryCtaLabel ?? solution.tertiaryCtaLabel,
      }
    })
  }, [marketing.solutionOverrides, solutions])

  const activeSolution = useMemo(
    () => localizedSolutions[activeIndex] ?? localizedSolutions[0],
    [localizedSolutions, activeIndex],
  )

  if (!localizedSolutions.length || !activeSolution) {
    return null
  }

  const { productMatrix } = marketing
  const overviewHighlights = productMatrix.highlights

  const ctas = [
    activeSolution.primaryCtaLabel && activeSolution.primaryCtaHref
      ? {
          label: activeSolution.primaryCtaLabel,
          href: activeSolution.primaryCtaHref,
          variant: 'primary' as const,
        }
      : null,
    activeSolution.secondaryCtaLabel && activeSolution.secondaryCtaHref
      ? {
          label: activeSolution.secondaryCtaLabel,
          href: activeSolution.secondaryCtaHref,
          variant: 'secondary' as const,
        }
      : null,
    activeSolution.tertiaryCtaLabel && activeSolution.tertiaryCtaHref
      ? {
          label: activeSolution.tertiaryCtaLabel,
          href: activeSolution.tertiaryCtaHref,
          variant: 'ghost' as const,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string; variant: 'primary' | 'secondary' | 'ghost' }>

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-brand-border bg-white p-8 text-brand-heading shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-8">
            <header className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-surface px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
                {productMatrix.badge}
              </span>
              <h1 className="text-[30px] font-bold leading-tight text-brand sm:text-[34px] md:text-[36px]">
                {productMatrix.title}
              </h1>
              <p className="text-sm text-brand-heading/80 sm:text-base lg:text-lg">
                {productMatrix.description}
              </p>
            </header>
            <ul className="grid gap-2 text-sm text-brand-heading/80 sm:grid-cols-2 lg:grid-cols-3">
              {overviewHighlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2"
                >
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand" aria-hidden />
                  <span className="leading-relaxed">{highlight}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
                {productMatrix.topicsLabel}
              </p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">
                  {activeSolution.tagline}
                </p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">
                  {productMatrix.capabilitiesLabel}
                </p>
                <ul className="grid gap-2 text-sm text-brand-heading/80 sm:grid-cols-2">
                  {activeSolution.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2"
                    >
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" aria-hidden />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {ctas.length ? (
              <div className="flex flex-wrap gap-3 pt-2">
                {ctas.map(({ href, label, variant }) => (
                  <Link
                    key={label}
                    prefetch={false}
                    href={href}
                    className={clsx(
                      'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand/30',
                      variant === 'primary'
                        ? 'bg-brand text-white shadow-[0_4px_20px_rgba(51,102,255,0.25)] hover:bg-brand-light'
                        : variant === 'secondary'
                        ? 'border border-brand-border text-brand hover:border-brand hover:bg-brand-surface'
                        : 'border border-brand-border text-brand-heading/80 hover:border-brand hover:bg-brand-surface',
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
