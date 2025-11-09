'use client'
import clsx from 'clsx'

import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'
import { designTokens, type PageVariant } from '@theme/designTokens'

const introCopy = {
  en: 'Explore our open-source suites with focused documentation sites. Each project extends Cloud-Neutral capabilities while staying easy to self-host.',
  zh: '了解 Cloud-Neutral 的开源项目，我们提供专题站点介绍核心能力，便于自建与二次开发。',
}

const projects = [
  {
    name: 'XCloudFlow',
    desc: {
      en: 'Multi-cloud IaC & GitOps automation with Terraform, Pulumi, and policy guardrails.',
      zh: '连接 Terraform、Pulumi 与 GitOps 的多云 IaC 自动化引擎，内建策略守护。',
    },
    link: 'https://www.svc.plus/xcloudflow',
  },
  {
    name: 'XScopeHub',
    desc: {
      en: 'Observability and AI-assisted collaboration that unifies metrics, logs, and traces.',
      zh: '统一指标、日志与链路的可观测平台，并以 AI 协作支撑事件分析与知识沉淀。',
    },
    link: 'https://www.svc.plus/xscopehub',
  },
  {
    name: 'XStream',
    desc: {
      en: 'Policy-as-code security automation with global delivery acceleration.',
      zh: '策略即代码的安全自动化引擎，为全球团队提供网络加速与合规能力。',
    },
    link: 'https://www.svc.plus/xstream',
  },
]

type OpenSourceProps = {
  variant?: PageVariant
}

export default function OpenSource({ variant = 'homepage' }: OpenSourceProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section
      id="open-sources"
      className={clsx(
        'relative',
        designTokens.spacing.section[variant],
        variant === 'homepage' ? 'bg-transparent' : 'bg-brand-surface/40'
      )}
    >
      <div className={clsx(designTokens.layout.container, 'flex flex-col gap-12')}>
        <h2 className="text-3xl font-bold text-center text-slate-900 sm:text-4xl">{t.openSourceTitle}</h2>
        <div className="mx-auto max-w-2xl text-center text-sm text-slate-600 sm:text-base">
          <p>{introCopy[language]}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <a
              key={p.name}
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                designTokens.cards.base,
                designTokens.transitions[variant],
                'flex flex-col gap-3 p-6 text-left'
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">{p.name}</span>
              <span className="text-base font-semibold text-slate-900 sm:text-lg">{p.desc[language]}</span>
              <span className="text-sm font-medium text-brand transition hover:text-brand-dark">
                {language === 'zh' ? '访问专题站点' : 'Visit product site'} →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
