'use client'

import clsx from 'clsx'

import Features from '@components/Features'
import OpenSource from '@components/OpenSource'
import DownloadSection from '@components/DownloadSection'
import CommunityFeed from '@components/home/CommunityFeed'
import Sidebar from '@components/home/Sidebar'
import { designTokens } from '@theme/designTokens'

import { useLanguage } from '../../i18n/LanguageProvider'

const heroContent = {
  zh: {
    eyebrow: 'Cloud-Neutral',
    title: '构建一体化的 Cloud-Neutral 云原生生态',
    description:
      '通过统一治理、自动化与可观测能力，连接团队、工具与环境，让企业以更简洁的方式管理复杂的多云栈。',
    focusAreas: ['跨云统一治理', '安全与合规自动化', '可观测与智能协同'],
    ctaLabel: '了解产品详情',
    products: [
      {
        label: 'XCloudFlow',
        headline: '多云自动化与 GitOps 编排',
        description: '声明式 IaC 引擎连接 Terraform、Pulumi 与 GitOps 流水线，帮助平台团队统一变更治理。',
        href: 'https://www.svc.plus/xcloudflow',
      },
      {
        label: 'XScopeHub',
        headline: '可观测与智能协同',
        description: '统一指标、日志与链路拓扑，并结合 AI 协作完成事件诊断、知识沉淀与跨团队协同。',
        href: 'https://www.svc.plus/xscopehub',
      },
      {
        label: 'XStream',
        headline: '安全与合规自动化',
        description: '策略即代码守护交付流水线，为全球团队提供网络加速、合规审计与安全基线。',
        href: 'https://www.svc.plus/xstream',
      },
    ],
  },
  en: {
    eyebrow: 'Cloud-Neutral',
    title: 'Build a Cloud-Neutral cloud operations fabric',
    description:
      'Unify governance, automation, and observability so teams can manage complex multi-cloud estates with clarity.',
    focusAreas: ['Unified multi-cloud governance', 'Automated security & compliance', 'Observability with intelligent workflows'],
    ctaLabel: 'Explore product site',
    products: [
      {
        label: 'XCloudFlow',
        headline: 'Multi-cloud automation & GitOps orchestration',
        description: 'A declarative IaC engine that connects Terraform, Pulumi, and GitOps pipelines so platform teams govern change consistently.',
        href: 'https://www.svc.plus/xcloudflow',
      },
      {
        label: 'XScopeHub',
        headline: 'Observability & intelligent collaboration',
        description: 'Unify metrics, logs, and traces with AI-guided incident response, knowledge sharing, and cross-team coordination.',
        href: 'https://www.svc.plus/xscopehub',
      },
      {
        label: 'XStream',
        headline: 'Security & compliance automation',
        description: 'Policy-as-code guardrails with global acceleration that keep distributed releases fast, auditable, and compliant.',
        href: 'https://www.svc.plus/xstream',
      },
    ],
  },
}

export default function Homepage() {
  const { language } = useLanguage()
  const content = heroContent[language]

  return (
    <main className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white/90 py-20 shadow-sm sm:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-5xl rounded-full bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 blur-3xl" />
        <div className={clsx('relative', designTokens.layout.container)}>
          <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-10 lg:items-stretch">
            <div className="min-h-full space-y-8">
              <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                {content.eyebrow}
              </span>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{content.title}</h1>
                <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">{content.description}</p>
              </div>
              <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                {content.focusAreas.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden />
                    <span className="font-medium text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-4">
                {content.products.map((product) => (
                  <div
                    key={product.label}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">{product.label}</span>
                    <h3 className="text-lg font-semibold text-slate-900">{product.headline}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
                    <a
                      href={product.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-brand transition hover:text-brand-dark"
                    >
                      {content.ctaLabel} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:sticky lg:top-0 lg:h-fit lg:w-[360px]">
              <Sidebar />
            </div>
          </div>
        </div>
      </section>
      <Features variant="homepage" />
      <OpenSource variant="homepage" />
      <DownloadSection variant="homepage" />
    </main>
  )
}
