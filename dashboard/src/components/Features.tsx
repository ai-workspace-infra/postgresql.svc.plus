import clsx from 'clsx'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { useLanguage } from '../i18n/LanguageProvider'
import { designTokens, type PageVariant } from '@theme/designTokens'

type FeatureCard = {
  title: string
  description: string
  href: string
  badge: string
}

type EcosystemNode = {
  title: string
  description: string
  accent: string
}

const featureCopy: Record<PageVariant, Record<'zh' | 'en', { title: string; subtitle: string }>> = {
  homepage: {
    zh: {
      title: '构建一体化的 Cloud-Neutral 云原生生态',
      subtitle: '通过统一治理、自动化与可观测能力，连接团队、工具与环境。',
    },
    en: {
      title: 'Build a unified Cloud-Neutral cloud-native ecosystem',
      subtitle: 'Connect teams, toolchains, and environments with shared governance, automation, and observability.',
    },
  },
  product: {
    zh: {
      title: '产品矩阵',
      subtitle: '覆盖 DevOps、运维、观测与 AI 的全栈云原生工具。',
    },
    en: {
      title: 'Product Overview',
      subtitle: 'A cohesive toolchain built for hybrid and multi-cloud operators.',
    },
  },
}

const ecosystemChips: Record<'zh' | 'en', string[]> = {
  zh: ['跨云统一治理', '安全与合规自动化', '可观测与智能分析'],
  en: ['Cross-cloud governance', 'Security & compliance automation', 'Observability & intelligent insights'],
}

const ecosystemNodes: Record<'zh' | 'en', EcosystemNode[]> = {
  zh: [
    {
      title: 'XCloudFlow — 多云自动化与策略治理',
      description: '以策略驱动的工作流将 IaC、GitOps 与团队权限串联，形成统一治理中心。',
      accent: 'from-blue-100/80',
    },
    {
      title: 'XScopeHub — 可观测与智能分析',
      description: '多维度指标、日志与追踪数据沉淀到统一可观测底座，为自动化决策提供洞察。',
      accent: 'from-indigo-100/80',
    },
    {
      title: 'XStream — 网络加速与安全通信',
      description: '覆盖边缘与中心的安全连接网络，让混合云与多集群的体验保持一致。',
      accent: 'from-sky-100/80',
    },
  ],
  en: [
    {
      title: 'XCloudFlow — Multi-cloud automation & policy governance',
      description: 'Policy-driven workflows braid IaC, GitOps, and access controls into a single governance hub.',
      accent: 'from-blue-100/80',
    },
    {
      title: 'XScopeHub — Observability & intelligent analytics',
      description: 'Metrics, logs, and traces converge into one observability plane, powering adaptive automation.',
      accent: 'from-indigo-100/80',
    },
    {
      title: 'XStream — Network acceleration & secure communications',
      description: 'An intelligent connectivity layer spanning edge and core keeps hybrid footprints performant and safe.',
      accent: 'from-sky-100/80',
    },
  ],
}

const productCards: Record<'zh' | 'en', FeatureCard[]> = {
  zh: [
    {
      title: 'XCloudFlow',
      description: 'Pulumi 引擎驱动的多云 IaC，统一 DevOps 与合规审计。',
      href: '/demo?product=xcloudflow',
      badge: 'IaC + GitOps',
    },
    {
      title: 'XScopeHub',
      description: '全链路观测平台，结合 ETL、OpenObserve 与 AI 分析。',
      href: '/insight',
      badge: 'Observability',
    },
    {
      title: 'Navi Copilot',
      description: '为运维和平台团队提供 AI 自动化与知识工作流。',
      href: '/docs',
      badge: 'AI Automation',
    },
  ],
  en: [
    {
      title: 'XCloudFlow',
      description: 'Multi-cloud IaC powered by Pulumi with built-in compliance guardrails.',
      href: '/demo?product=xcloudflow',
      badge: 'IaC + GitOps',
    },
    {
      title: 'XScopeHub',
      description: 'Unified observability fabric combining ETL, OpenObserve, and AI insights.',
      href: '/insight',
      badge: 'Observability',
    },
    {
      title: 'Navi Copilot',
      description: 'AI automations and guided workflows for platform & SRE teams.',
      href: '/docs',
      badge: 'AI Automation',
    },
  ],
}

type FeaturesProps = {
  variant?: PageVariant
}

export default function Features({ variant = 'homepage' }: FeaturesProps) {
  const { language } = useLanguage()

  if (variant === 'homepage') {
    const chips = ecosystemChips[language]
    const nodes = ecosystemNodes[language]
    const copy = featureCopy.homepage[language]

    return (
      <section
        className={clsx(
          'relative overflow-hidden bg-gradient-to-b from-white to-blue-50',
          designTokens.spacing.section.homepage
        )}
        aria-labelledby="cloud-neutral-ecosystem"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(51,102,255,0.08),_transparent_55%)]" aria-hidden />
        <div
          className={clsx(
            designTokens.layout.container,
            'relative z-10 flex flex-col items-center gap-10 text-center'
          )}
        >
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 id="cloud-neutral-ecosystem" className="text-5xl font-semibold text-slate-900">
              {copy.title}
            </h2>
            <p className="text-lg text-slate-600 sm:text-xl">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-blue-100 bg-white px-6 py-2 text-sm font-medium text-brand-dark shadow-sm"
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="grid w-full gap-8 lg:grid-cols-3">
            {nodes.map((node) => (
              <article
                key={node.title}
                className={clsx(
                  'group relative h-full rounded-2xl border border-blue-100/60 bg-gradient-to-b to-white p-10 text-left shadow-soft transition duration-700 hover:shadow-lg',
                  node.accent
                )}
              >
                <div className="flex h-full flex-col gap-5">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold text-slate-900">{node.title}</h3>
                    <p className="text-base text-slate-600">{node.description}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-brand-dark">
                    <span>{language === 'zh' ? '作为生态节点互联' : 'Interconnected across the ecosystem'}</span>
                    <span aria-hidden>→</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const localizedCards = productCards[language]
  const copy = featureCopy.product[language]

  return (
    <section
      className={clsx('relative bg-white', designTokens.spacing.section.product)}
      aria-labelledby="product-overview"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-transparent" aria-hidden />
      <div className={clsx(designTokens.layout.container, 'relative z-10 flex flex-col gap-12')}>
        <div className="max-w-3xl space-y-4">
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-dark/80">
            {language === 'zh' ? '产品矩阵' : 'Product Overview'}
          </span>
          <h2 id="product-overview" className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {copy.title}
          </h2>
          <p className="text-base text-slate-600 sm:text-lg">{copy.subtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {localizedCards.map((card) => (
            <article
              key={card.title}
              className={clsx(
                designTokens.cards.base,
                designTokens.transitions.product,
                'flex flex-col gap-6 p-8 backdrop-blur'
              )}
            >
              <div className="flex items-center justify-between text-sm font-medium text-brand">
                <span>{card.badge}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-slate-900">{card.title}</h3>
                <p className="text-sm text-slate-600 sm:text-base">{card.description}</p>
              </div>
              <Link
                href={card.href}
                className={clsx(
                  designTokens.buttons.base,
                  designTokens.buttons.palette.primary,
                  designTokens.buttons.shape.product,
                  designTokens.transitions.product,
                  'self-start'
                )}
              >
                {language === 'zh' ? '立即体验' : 'Explore'}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
