'use client'

import clsx from 'clsx'
import Link from 'next/link'

import { useLanguage } from '../../i18n/LanguageProvider'
import { designTokens } from '@theme/designTokens'
import type { HomepagePost } from '@cms/content'

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
      className={clsx(
        'relative overflow-hidden',
        designTokens.spacing.section.homepage,
        'bg-gradient-to-tr from-brand-surface/50 via-white to-white'
      )}
      aria-labelledby="community-feed"
    >
      <div className={clsx(designTokens.layout.container, 'relative z-10 flex flex-col gap-12')}>
        <div className="max-w-2xl space-y-4">
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-dark/80">
            {language === 'zh' ? '社区更新' : 'Community'}
          </span>
          <h2 id="community-feed" className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {data.title}
          </h2>
          <p className="text-base text-slate-600 sm:text-lg">{data.subtitle}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {recentPosts.map((post) => (
            <article
              key={post.slug}
              className={clsx(
                designTokens.cards.base,
                designTokens.transitions.homepage,
                'flex flex-col gap-4 p-8 backdrop-blur'
              )}
            >
              <div className="flex items-center justify-between text-sm font-semibold text-brand">
                <span>Blog</span>
                <span className="text-xs text-slate-500">{formatDate(post.date, language)}</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">{post.title}</h3>
                <p className="text-sm text-slate-600 sm:text-base">{post.excerpt}</p>
                {post.author && (
                  <p className="text-xs text-slate-500">
                    {language === 'zh' ? '作者' : 'By'} {post.author}
                  </p>
                )}
              </div>
              <Link
                href="/blog"
                className={clsx(
                  designTokens.buttons.base,
                  designTokens.buttons.palette.secondary,
                  designTokens.buttons.shape.homepage,
                  designTokens.transitions.homepage,
                  'self-start'
                )}
              >
                {data.cta}
              </Link>
            </article>
          ))}

          {recentPosts.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-20">
              <p className="text-slate-500">暂无博客更新</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
