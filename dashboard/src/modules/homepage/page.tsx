'use client'

import clsx from 'clsx'
import { useState } from 'react'

import Sidebar from '@components/home/Sidebar'
import { designTokens } from '@theme/designTokens'

import { useLanguage } from '../../i18n/LanguageProvider'

export default function Homepage() {
  const { language } = useLanguage()
  const heroCopy = {
    zh: {
      eyebrow: 'Unified toolkit',
      title: '以统一工具集开启云原生',
      subtitle: 'Get started with A Unified Toolkit for Cloud-Native，保持控制台视角，立即进入工作流。',
      cta: '进入控制台',
      secondary: '查看文档',
    },
    en: {
      eyebrow: 'Unified toolkit',
      title: 'Get started with A Unified Toolkit for Cloud-Native',
      subtitle: 'Create, configure, and operate across clouds from a single, console-first surface.',
      cta: 'Open Console',
      secondary: 'View Docs',
    },
  }
  const hero = heroCopy[language]

  const resourceModules = [
    {
      name: 'XCloudFlow',
      description:
        language === 'zh'
          ? 'GitOps 与多云编排中枢，负责流水线、环境与变更的统一治理。'
          : 'GitOps and multi-cloud orchestration core that governs pipelines, environments, and changes.',
      link: 'https://www.svc.plus/xcloudflow',
      action: language === 'zh' ? '进入' : 'Open',
      icon: '↗',
      category: 'delivery',
    },
    {
      name: 'XScopeHub',
      description:
        language === 'zh'
          ? '全栈可观测与协作中心，连接指标、日志、告警与团队响应。'
          : 'End-to-end observability and collaboration across metrics, logs, alerts, and response.',
      link: 'https://www.svc.plus/xscopehub',
      action: language === 'zh' ? '详情' : 'Details',
      icon: '⟲',
      category: 'observability',
    },
    {
      name: 'XStream',
      description:
        language === 'zh'
          ? '合规与网络防护的统一入口，策略即代码驱动安全审计。'
          : 'Unified entry for compliance and network protection with policy-as-code guardrails.',
      link: 'https://www.svc.plus/xstream',
      action: language === 'zh' ? '详情' : 'Details',
      icon: '☰',
      category: 'security',
    },
    {
      name: 'XControl Platform',
      description:
        language === 'zh'
          ? '平台级身份、策略与集成层，串联全部服务模块。'
          : 'Platform identity, policy, and integration layer connecting every service module.',
      link: '#',
      action: language === 'zh' ? '进入' : 'Open',
      icon: '◆',
      category: 'platform',
    },
  ]

  const serviceFilters = [
    { key: 'all', label: language === 'zh' ? '全部' : 'All' },
    { key: 'delivery', label: language === 'zh' ? '交付' : 'Delivery' },
    { key: 'observability', label: language === 'zh' ? '观测' : 'Observability' },
    { key: 'security', label: language === 'zh' ? '安全治理' : 'Security' },
    { key: 'platform', label: language === 'zh' ? '平台' : 'Platform' },
  ]

  const nextSteps = [
    {
      title: language === 'zh' ? '创建项目' : 'Create Project',
      description:
        language === 'zh'
          ? '初始化环境、接入凭据并选择运行区域，建立基础工作区。'
          : 'Initialize environments, connect credentials, and pick regions to set up a workspace.',
    },
    {
      title: language === 'zh' ? '注册应用' : 'Register App',
      description:
        language === 'zh'
          ? '为服务分配身份与密钥，配置 OAuth/OIDC 与回调安全策略。'
          : 'Assign identity and secrets for services, configure OAuth/OIDC, and callback security.',
    },
    {
      title: language === 'zh' ? '配置策略' : 'Configure Policies',
      description:
        language === 'zh'
          ? '在各模块统一设置访问控制、合规审计与网络准入。'
          : 'Apply access controls, compliance audits, and network admission rules across modules.',
    },
    {
      title: language === 'zh' ? '邀请成员' : 'Invite Users',
      description:
        language === 'zh'
          ? '按团队或角色邀请成员，启用审批与操作审计。'
          : 'Invite teammates by role, enable approvals, and track operational audits.',
    },
  ]

  const updates = [
    {
      title: language === 'zh' ? 'XCloudFlow 发布全新环境模板' : 'XCloudFlow ships new environment templates',
      date: '2024-05-12',
      tag: language === 'zh' ? 'Release' : 'Release',
      summary:
        language === 'zh'
          ? '标准化 IaC 资产库，支持多集群蓝图与审批链路。'
          : 'Standardized IaC catalogs now support multi-cluster blueprints and approval paths.',
    },
    {
      title: language === 'zh' ? '多云治理指南新增零信任章节' : 'Multi-cloud governance guide adds Zero Trust chapter',
      date: '2024-04-28',
      tag: language === 'zh' ? 'Guide' : 'Guide',
      summary:
        language === 'zh'
          ? '涵盖跨地域访问控制、网络隔离与策略即代码实践。'
          : 'Covers cross-region access control, network isolation, and policy-as-code patterns.',
    },
    {
      title: language === 'zh' ? '社区发布 GitOps 最佳实践案例集' : 'Community publishes GitOps best-practice kit',
      date: '2024-04-05',
      tag: language === 'zh' ? 'Community' : 'Community',
      summary:
        language === 'zh'
          ? '收录三种上线策略、回滚范式与指标告警联动示例。'
          : 'Includes rollout strategies, rollback patterns, and examples linking metrics to alerts.',
    },
  ]

  const statusCards = [
    {
      title: language === 'zh' ? '控制面可用性' : 'Control plane uptime',
      value: '99.9%',
      meta: language === 'zh' ? '本月' : 'This month',
    },
    {
      title: language === 'zh' ? '活跃服务' : 'Active services',
      value: '24',
      meta: language === 'zh' ? '跨区域' : 'Cross-region',
    },
    {
      title: language === 'zh' ? '待审批变更' : 'Pending approvals',
      value: '3',
      meta: language === 'zh' ? '需审核' : 'Requires review',
    },
  ]

  const [activeFilter, setActiveFilter] = useState<string>('all')

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f6f7f9] text-slate-900">
      <div className={clsx(designTokens.layout.container, 'py-16 lg:py-20')}>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <section className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    <span className="rounded-md border border-black/10 px-3 py-1">{hero.eyebrow}</span>
                    <span className="text-slate-400">Platform Overview</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                    {language === 'zh' ? '运行正常 · 北美 / 亚太' : 'Operational · NA / APAC'}
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-[28px]">{hero.title}</h1>
                  <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">{hero.subtitle}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-md bg-[#3467e9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2957cf]"
                  >
                    {hero.cta}
                    <span aria-hidden>→</span>
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-md border border-black/10 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-[#f6f7f9]"
                  >
                    {hero.secondary}
                  </a>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {statusCards.map((card) => (
                    <div key={card.title} className="rounded-md border border-black/10 bg-[#f6f7f9] px-4 py-3">
                      <p className="text-[12px] text-slate-600">{card.title}</p>
                      <p className="text-xl font-semibold text-slate-900">{card.value}</p>
                      <p className="text-[12px] text-slate-500">{card.meta}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-md border border-black/10 bg-[#f6f7f9] px-3 py-1 text-xs font-semibold text-slate-700">
                    API / CLI / SDK
                  </span>
                  <span className="text-xs text-slate-500">
                    {language === 'zh'
                      ? '控制台与自动化接口保持一致的操作体验'
                      : 'Console and automation interfaces stay aligned for every service.'}
                  </span>
                </div>
              </div>
            </section>
            <section className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {language === 'zh' ? '下一步' : 'Your next steps'}
                </p>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {language === 'zh' ? '按步骤完成初始配置' : 'Follow the guided setup'}
                </h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {nextSteps.map((step) => (
                  <div key={step.title} className="flex items-start gap-3 rounded-md border border-black/10 bg-[#f6f7f9] p-4">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#3467e9]/10 text-xs font-semibold text-[#3467e9]">
                      ✓
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                      <p className="text-sm text-slate-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {language === 'zh' ? '更多服务' : 'More services'}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                    {language === 'zh' ? '打开所需模块并继续集成' : 'Open the module you need next'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {language === 'zh'
                      ? '以卡片化入口打开交付、观测、安全与平台能力。'
                      : 'Open delivery, observability, security, and platform capabilities from card-first tabs.'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {serviceFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={clsx(
                      'rounded-md border px-3 py-1.5 text-sm font-semibold transition',
                      activeFilter === filter.key
                        ? 'border-[#3467e9]/70 bg-[#3467e9]/10 text-[#3467e9]'
                        : 'border-black/10 bg-[#f6f7f9] text-slate-700 hover:border-[#2957cf]/50'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {resourceModules
                  .filter((item) => activeFilter === 'all' || item.category === activeFilter)
                  .map((item) => (
                    <div
                      key={item.name}
                      className="flex h-full flex-col justify-between rounded-md border border-black/10 bg-[#f6f7f9] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-black/10 text-sm font-semibold text-slate-700">
                            {item.icon}
                          </span>
                          <div className="space-y-1">
                            <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                            <p className="text-sm text-slate-600">{item.description}</p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">{language === 'zh' ? '可用' : 'Available'}</span>
                      </div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#3467e9] hover:text-[#2957cf]"
                      >
                        {item.action}
                        <span aria-hidden>→</span>
                      </a>
                    </div>
                  ))}
              </div>
            </section>

            <section className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {language === 'zh' ? '更新' : 'Updates'}
                </p>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {language === 'zh' ? '最新发布与指南' : 'Latest releases and guides'}
                </h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {updates.map((item) => (
                  <article
                    key={item.title}
                    className="flex h-full flex-col justify-between rounded-md border border-black/10 bg-[#f6f7f9] p-4"
                  >
                    <div className="flex items-start justify-between text-[12px] text-slate-500">
                      <span className="rounded-full border border-black/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        {item.tag}
                      </span>
                      <span className="text-xs text-slate-500">{item.date}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-600">{item.summary}</p>
                    </div>
                    <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#3467e9] hover:text-[#2957cf]">
                      {language === 'zh' ? '查看详情' : 'View details'}
                      <span aria-hidden>→</span>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:sticky lg:top-10 lg:h-fit">
            <Sidebar />
          </div>
        </div>

      </div>
    </main>
  )
}
