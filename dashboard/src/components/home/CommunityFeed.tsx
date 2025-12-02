'use client'

import clsx from 'clsx'
import Link from 'next/link'

import { useLanguage } from '../../i18n/LanguageProvider'
import { designTokens } from '@theme/designTokens'
import type { HomepagePost } from '@lib/marketingContent'

const feed: Record<'zh' | 'en', { title: string; subtitle: string; cta: string }> = {
  zh: {
    title: '产品与社区快讯',
    subtitle: '来自用户群、社区活动与版本发布的实时更新。',
    cta: '浏览全部更新',
  },
  en: {
    title: 'Product & Community Pulse',
    subtitle: 'Stories from user groups, release notes, and field events.',
    cta: 'View all updates',
  },
}

function formatDate(dateStr: string | undefined, language: 'zh' | 'en'): string {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (language === 'zh') {
    if (diffHours < 1) return '刚刚'
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`
    return date.toLocaleDateString('zh-CN')
  } else {
    if (diffHours < 1) return 'just now'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-US')
  }
}

type CommunityFeedProps = {
  posts?: HomepagePost[]
}

export default function CommunityFeed({ posts = [] }: CommunityFeedProps) {
  const { language } = useLanguage()
  const data = feed[language]

  const recentPosts = posts.slice(0, 3)

  return (
    <section
      className={clsx('bg-[#f6f7f9]', designTokens.spacing.section.homepage)}
      aria-labelledby="community-feed"
    >
      <div className={clsx(designTokens.layout.container, 'flex flex-col gap-6 sm:gap-8')}>
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {language === 'zh' ? '更新' : 'Updates'}
          </span>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 id="community-feed" className="text-2xl font-semibold text-slate-900 sm:text-[24px]">
                {data.title}
              </h2>
              <p className="text-sm text-slate-600 sm:text-base">{data.subtitle}</p>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-[#3467e9] hover:text-[#2957cf]">
              {data.cta} →
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:[&>*]:h-full">
          {recentPosts.map((post) => (
            <article
              key={post.slug}
              className="flex h-full flex-col justify-between rounded-lg border border-black/10 bg-white p-5"
            >
              <div className="flex items-start justify-between text-[12px] text-slate-500">
                <span className="rounded-full border border-black/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Blog
                </span>
                <span>{formatDate(post.date, language)}</span>
              </div>
              <div className="mt-3 space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-slate-900"
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="text-sm text-slate-600">{post.excerpt}</p>
                {post.author && (
                  <p className="text-xs text-slate-500">
                    {language === 'zh' ? '作者' : 'By'} {post.author}
                  </p>
                )}
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#3467e9] hover:text-[#2957cf]"
              >
                {language === 'zh' ? '查看详情' : 'View details'}
                <span aria-hidden>→</span>
              </Link>
            </article>
          ))}

          {recentPosts.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center rounded-lg border border-black/10 bg-white py-16 text-sm text-slate-500">
              <p>{language === 'zh' ? '暂无更新' : 'No updates yet'}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
