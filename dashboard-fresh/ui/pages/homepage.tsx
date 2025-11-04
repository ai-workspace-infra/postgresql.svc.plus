'use client'

import MarkdownSection from '../components/MarkdownSection'
import { useLanguage, type Language } from '../../i18n/LanguageProvider'

const SECTION_PATHS: Record<Language, {
  operations: string
  productSpotlight: string
  news: string
  support: string
  community: string
  resources: string
}> = {
  zh: {
    operations: 'homepage/zh/operations.md',
    productSpotlight: 'homepage/zh/products.md',
    news: 'homepage/zh/news.md',
    support: 'homepage/zh/support.md',
    community: 'homepage/zh/community.md',
    resources: 'homepage/zh/resources.md',
  },
  en: {
    operations: 'homepage/en/operations.md',
    productSpotlight: 'homepage/en/products.md',
    news: 'homepage/en/news.md',
    support: 'homepage/en/support.md',
    community: 'homepage/en/community.md',
    resources: 'homepage/en/resources.md',
  },
}

const DEFAULT_LANGUAGE: Language = 'zh'

export default function MarkdownHomepage() {
  const { language } = useLanguage()
  const sections = SECTION_PATHS[language] ?? SECTION_PATHS[DEFAULT_LANGUAGE]

  return (
    <main className="flex flex-col bg-brand-surface text-brand-heading">
      <header className="bg-brand py-16 text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8">
          <MarkdownSection
            src={sections.operations}
            headingLevel="h1"
            className="flex flex-col gap-4"
            headingClassName="text-[36px] font-bold text-white"
            contentClassName="prose-invert prose-headings:text-white prose-strong:text-white text-white/90"
          />
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-8 py-16">
        <MarkdownSection
          src={sections.productSpotlight}
          className="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          headingClassName="text-2xl font-semibold text-brand-navy"
          contentClassName="prose prose-slate mt-6 max-w-none text-brand-heading/80"
        />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_360px]">
          <MarkdownSection
            src={sections.news}
            className="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
            headingClassName="text-2xl font-semibold text-brand-navy"
            contentClassName="prose prose-slate mt-6 max-w-none text-brand-heading/80"
          />
          <div className="flex flex-col gap-12">
            <MarkdownSection
              src={sections.support}
              className="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
              headingClassName="text-2xl font-semibold text-brand-navy"
              contentClassName="prose prose-slate mt-6 max-w-none text-brand-heading/80"
            />
            <MarkdownSection
              src={sections.resources}
              className="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
              headingClassName="text-2xl font-semibold text-brand-navy"
              contentClassName="prose prose-slate mt-6 max-w-none text-brand-heading/80"
            />
          </div>
        </div>
        <MarkdownSection
          src={sections.community}
          className="rounded-2xl border border-brand-border bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          headingClassName="text-2xl font-semibold text-brand-navy"
          contentClassName="prose prose-slate mt-6 max-w-none text-brand-heading/80"
        />
      </section>
    </main>
  )
}
