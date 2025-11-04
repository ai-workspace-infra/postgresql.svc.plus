'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import type { HomepagePost } from '@cms/content'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'

type ArticleFeedClientProps = {
  posts: HomepagePost[]
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default function ArticleFeedClient({ posts }: ArticleFeedClientProps) {
  const { language } = useLanguage()
  const marketing = translations[language].marketing.home
  const { articleFeed } = marketing
  const articleOverrides = marketing.articleOverrides

  const mappedPosts = useMemo(
    () =>
      posts.map((post) => {
        const override = articleOverrides?.[post.slug]
        return {
          ...post,
          title: override?.title ?? post.title,
          author: override?.author ?? post.author,
          readingTime: override?.readingTime ?? post.readingTime,
          excerpt: override?.excerpt ?? post.excerpt,
          tags: override?.tags ?? post.tags,
          formattedDate: formatDate(post.date, articleFeed.dateLocale),
        }
      }),
    [articleFeed.dateLocale, articleOverrides, posts],
  )

  return (
    <section className="space-y-8 text-brand-heading">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand">{articleFeed.eyebrow}</p>
          <h2 className="text-2xl font-semibold text-brand-navy sm:text-[26px]">{articleFeed.title}</h2>
        </div>
        <Link
          href="/docs"
          className="text-sm font-medium text-brand transition hover:text-brand-light"
        >
          {articleFeed.viewAll}
        </Link>
      </header>
      <div className="space-y-8">
        {!mappedPosts.length ? (
          <p className="rounded-2xl border border-dashed border-brand-border bg-white p-8 text-center text-sm text-brand-heading/70">
            {articleFeed.empty}
          </p>
        ) : null}
        {mappedPosts.map((post) => (
          <article
            key={post.slug}
            className="group rounded-2xl border border-brand-border bg-white p-6 text-brand-heading shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:border-brand hover:shadow-[0_6px_24px_rgba(51,102,255,0.2)] sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-brand-heading/60 sm:text-sm">
              {post.formattedDate ? <span>{post.formattedDate}</span> : null}
              {post.author ? (
                <span className="flex items-center gap-2">
                  <span className="hidden h-1 w-1 rounded-full bg-brand-border sm:inline" aria-hidden />
                  <span>{post.author}</span>
                </span>
              ) : null}
              {post.readingTime ? (
                <span className="flex items-center gap-2">
                  <span className="hidden h-1 w-1 rounded-full bg-brand-border sm:inline" aria-hidden />
                  <span>{post.readingTime}</span>
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 text-lg font-medium text-brand-heading transition group-hover:text-brand sm:text-xl">
              {post.title}
            </h3>
            {post.excerpt ? <p className="mt-3 text-sm text-brand-heading/80 sm:text-base">{post.excerpt}</p> : null}
            {post.tags.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-heading"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

