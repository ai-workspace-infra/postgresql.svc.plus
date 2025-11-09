'use client'

import clsx from 'clsx'

import Hero from '@components/Hero'
import Features from '@components/Features'
import OpenSource from '@components/OpenSource'
import DownloadSection from '@components/DownloadSection'
import CommunityFeed from '@components/home/CommunityFeed'
import { designTokens } from '@theme/designTokens'

import { useLanguage } from '../../i18n/LanguageProvider'

const heroCopy = {
  zh: {
    eyebrow: 'Cloud-Neutral',
    title: '云原生套件',
    description: '构建一体化的云原生工具集，让 DevOps、观测与 AI 协作拥有更轻盈的体验。',
    highlights: ['多云 IaC 与 GitOps 统一编排', '全链路观测与事件驱动的自动化响应', 'AI Copilot 嵌入日常运维', '企业级身份、合规与安全防护'],
    primaryCta: { label: '产品体验', href: '/demo?product=xcloudflow' },
    secondaryCta: { label: '了解方案', href: '/docs' },
  },
  en: {
    eyebrow: 'Cloud-Neutral',
    title: 'Cloud-Native Suite',
    description: 'A unified toolkit for DevOps, observability, and AI workflows with room to breathe.',
    highlights: ['Orchestrate multi-cloud IaC and GitOps', 'Streaming observability with automated responses', 'AI copilots embedded in platform operations', 'Enterprise-grade identity, compliance, and security'],
    primaryCta: { label: 'Try the product', href: '/demo?product=xcloudflow' },
    secondaryCta: { label: 'Explore docs', href: '/docs' },
  },
}

function HeroMedia() {
  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand/20 via-transparent to-transparent blur-3xl" aria-hidden />
      <div
        className={clsx(
          'relative overflow-hidden backdrop-blur-lg',
          designTokens.effects.radii.xl,
          designTokens.effects.shadows.soft,
          'border border-brand-border bg-white/80 p-8'
        )}
      >
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-dark/80">Stack Snapshot</p>
            <p className="mt-2 text-sm text-slate-600">Terraform · Pulumi · Helm · ArgoCD</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[{ label: 'Clusters', value: '38' }, { label: 'Pipelines', value: '126' }, { label: 'Playbooks', value: '42' }, { label: 'Latency', value: '99.9% SLA' }].map((item) => (
              <div key={item.label} className="rounded-xl border border-brand-border/60 bg-white/70 p-4 shadow-sm">
                <dt className="text-xs uppercase tracking-wide text-slate-500">{item.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-2xl border border-brand-border/60 bg-gradient-to-r from-brand-surface/60 to-white px-5 py-4 text-sm text-slate-600">
            <p>AI Copilot routed <span className="font-semibold text-brand-dark">12</span> incidents to automation in the last 24 hours.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Homepage() {
  const { language } = useLanguage()
  const copy = heroCopy[language]

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-b from-white via-brand-surface/20 to-white text-slate-900">
      <Hero
        variant="homepage"
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        highlights={copy.highlights}
        primaryCta={copy.primaryCta}
        secondaryCta={copy.secondaryCta}
        media={<HeroMedia />}
      />
      <Features variant="homepage" />
      <CommunityFeed />
      <OpenSource variant="homepage" />
      <DownloadSection variant="homepage" />
    </main>
  )
}
