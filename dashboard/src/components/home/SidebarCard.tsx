'use client'

import Link from 'next/link'

import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import type { SidebarSection } from '@lib/marketingContent'

interface SidebarCardProps {
  section: SidebarSection
}

function isValidCta(section: SidebarSection): section is SidebarSection & {
  ctaLabel: string
  ctaHref: string
} {
  return Boolean(section.ctaLabel && section.ctaHref)
}

export default function SidebarCard({ section }: SidebarCardProps) {
  const { language } = useLanguage()
  const sidebarOverrides = translations[language].marketing.home.sidebarOverrides
  const override = sidebarOverrides?.[section.slug]

  const localizedSection = override
    ? {
        ...section,
        title: override.title ?? section.title,
        bodyHtml: override.bodyHtml ?? section.bodyHtml,
        ctaLabel: override.ctaLabel ?? section.ctaLabel,
        ctaHref: override.ctaHref ?? section.ctaHref,
        tags: override.tags ?? section.tags,
      }
    : section

  const hasTagsLayout = localizedSection.layout === 'tags' && localizedSection.tags.length > 0

  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 text-brand-heading shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-brand-heading">{localizedSection.title}</h3>
        {isValidCta(localizedSection) ? (
          <Link
            href={localizedSection.ctaHref}
            className="text-sm font-medium text-brand transition hover:text-brand-light"
          >
            {localizedSection.ctaLabel}
          </Link>
        ) : null}
      </header>
      {hasTagsLayout ? (
        <div className="flex flex-wrap gap-2">
          {localizedSection.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-heading"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : (
        <div
          className="prose prose-sm max-w-none text-brand-heading/80 [&_a]:text-brand [&_a]:no-underline hover:[&_a]:underline"
          dangerouslySetInnerHTML={{ __html: localizedSection.bodyHtml }}
        />
      )}
    </section>
  )
}
