import clsx from 'clsx'
import Link from 'next/link'

import { useLanguage } from '../../i18n/LanguageProvider'
import { designTokens } from '@theme/designTokens'

type FeedItem = {
  title: string
  excerpt: string
  href: string
  category: string
  time: string
}

const feed: Record<'zh' | 'en', { title: string; subtitle: string; items: FeedItem[]; cta: string }> = {
  zh: {
    title: '社区与动态',
    subtitle: '来自用户群、社区活动与版本发布的实时更新。',
    cta: '查看全部动态',
    items: [
      {
        title: 'KubeGuard v2.0 Beta 发布',
        excerpt: '新增集群恢复编排、AI 漏洞巡检以及跨区域容灾演练流程模板。',
        href: '/docs/releases/kubeguard-v2',
        category: 'Release',
        time: '2 小时前',
      },
      {
        title: 'Cloud-Native Meetup · 深圳站回顾',
        excerpt: '分享 XScopeHub 如何在 2000+ 节点场景下实现可观测性弹性扩展。',
        href: '/community/events/shenzhen-meetup',
        category: 'Event',
        time: '昨天',
      },
      {
        title: 'Navi Copilot Workflow Library',
        excerpt: '社区贡献 18 个常用运维自动化场景，支持一键导入平台。',
        href: '/docs/navi-workflows',
        category: 'Community',
        time: '本周热点',
      },
    ],
  },
  en: {
    title: 'Community Pulse',
    subtitle: 'Stories from user groups, release notes, and field events.',
    cta: 'View all updates',
    items: [
      {
        title: 'KubeGuard v2.0 beta ships',
        excerpt: 'Disaster recovery playbooks, AI-driven drift detection, and region failover drills.',
        href: '/docs/releases/kubeguard-v2',
        category: 'Release',
        time: '2 hours ago',
      },
      {
        title: 'Cloud-Native Meetup · Shenzhen recap',
        excerpt: 'How XScopeHub scales observability to 2K+ nodes with streaming ETL.',
        href: '/community/events/shenzhen-meetup',
        category: 'Event',
        time: 'Yesterday',
      },
      {
        title: 'Navi Copilot workflow library',
        excerpt: '18 automation recipes contributed by the community, ready to import.',
        href: '/docs/navi-workflows',
        category: 'Community',
        time: 'Trending',
      },
    ],
  },
}

export default function CommunityFeed() {
  const { language } = useLanguage()
  const data = feed[language]

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
          {data.items.map((item) => (
            <article
              key={item.title}
              className={clsx(
                designTokens.cards.base,
                designTokens.transitions.homepage,
                'flex flex-col gap-4 p-8 backdrop-blur'
              )}
            >
              <div className="flex items-center justify-between text-sm font-semibold text-brand">
                <span>{item.category}</span>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">{item.title}</h3>
                <p className="text-sm text-slate-600 sm:text-base">{item.excerpt}</p>
              </div>
              <Link
                href={item.href}
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
        </div>
      </div>
    </section>
  )
}
