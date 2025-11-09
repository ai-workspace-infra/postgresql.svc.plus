import clsx from 'clsx'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { designTokens, type ButtonVariant, type PageVariant } from '@theme/designTokens'

type HeroCta = {
  label: string
  href?: string
  onClick?: () => void | Promise<void>
  icon?: ReactNode
  variant?: ButtonVariant
}

type HeroProps = {
  variant?: PageVariant
  eyebrow?: string
  title: string
  description?: string
  highlights?: string[]
  badges?: string[]
  primaryCta?: HeroCta
  secondaryCta?: HeroCta
  tertiaryCta?: HeroCta
  media?: ReactNode
  decoration?: ReactNode
  className?: string
  contentClassName?: string
}

const variantConfig: Record<PageVariant, { container: string; content: string; highlights: string; actions: string }> = {
  homepage: {
    container: clsx(
      designTokens.layout.container,
      designTokens.hero.heights.homepage,
      designTokens.spacing.section.homepage,
      'flex flex-col justify-center gap-16'
    ),
    content: 'max-w-3xl space-y-6 text-slate-900',
    highlights: 'grid gap-4 text-base text-slate-600 sm:grid-cols-2',
    actions: 'flex flex-wrap items-center gap-4 pt-4',
  },
  product: {
    container: clsx(
      designTokens.layout.container,
      designTokens.hero.heights.product,
      designTokens.spacing.section.product,
      'flex flex-col gap-12 lg:flex-row lg:items-center'
    ),
    content: 'max-w-2xl space-y-5 text-slate-900',
    highlights: 'grid gap-3 text-sm text-slate-600 sm:grid-cols-2',
    actions: 'flex flex-wrap items-center gap-3 pt-2',
  },
}

function renderCta(variant: PageVariant, cta?: HeroCta, emphasis: ButtonVariant = 'primary') {
  if (!cta) return null

  const { base, palette, shape } = designTokens.buttons
  const resolvedVariant = cta.variant ?? emphasis
  const className = clsx(
    base,
    palette[resolvedVariant],
    designTokens.transitions[variant],
    shape[variant],
    'gap-2'
  )

  if (cta.href) {
    return (
      <Link href={cta.href} className={className} prefetch={false}>
        {cta.icon ? <span className="flex h-5 w-5 items-center justify-center">{cta.icon}</span> : null}
        <span>{cta.label}</span>
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={cta.onClick}>
      {cta.icon ? <span className="flex h-5 w-5 items-center justify-center">{cta.icon}</span> : null}
      <span>{cta.label}</span>
    </button>
  )
}

export default function Hero({
  variant = 'homepage',
  eyebrow,
  title,
  description,
  highlights,
  badges,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  media,
  decoration,
  className,
  contentClassName,
}: HeroProps) {
  const hasMedia = Boolean(media)
  const styles = variantConfig[variant]

  return (
    <section
      className={clsx(
        'relative overflow-hidden',
        designTokens.hero.background[variant],
        designTokens.transitions[variant],
        className
      )}
      aria-labelledby="hero-title"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(51,102,255,0.15),_transparent_55%)]" />
      </div>
      {decoration}
      <div className={clsx(styles.container, hasMedia ? 'lg:justify-between' : null)}>
        <div className={clsx('relative z-10 flex flex-col gap-6', styles.content, contentClassName)}>
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-brand-border bg-white/70 px-4 py-1 text-sm font-medium tracking-wide text-brand-dark">
              {eyebrow}
            </span>
          ) : null}
          <div className="space-y-4">
            <h1 id="hero-title" className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {description ? <p className="text-lg text-slate-600 sm:text-xl">{description}</p> : null}
          </div>
          {highlights?.length ? (
            <ul className={clsx('list-none', styles.highlights)}>
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className={styles.actions}>
            {renderCta(variant, primaryCta, 'primary')}
            {renderCta(variant, secondaryCta, 'secondary')}
            {renderCta(variant, tertiaryCta, 'secondary')}
          </div>
          {badges?.length ? (
            <ul className="flex flex-wrap gap-2 text-xs text-slate-600">
              {badges.map((badge) => (
                <li key={badge} className="rounded-full border border-brand-border bg-white/70 px-3 py-1">
                  {badge}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {hasMedia ? (
          <div className="relative z-10 flex flex-1 justify-center lg:justify-end">{media}</div>
        ) : null}
      </div>
    </section>
  )
}

export type { HeroProps, HeroCta }
