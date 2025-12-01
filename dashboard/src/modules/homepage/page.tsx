'use client'

import clsx from 'clsx'

import Sidebar from '@components/home/Sidebar'
import { designTokens } from '@theme/designTokens'

import { useLanguage } from '../../i18n/LanguageProvider'

export default function Homepage() {
  const { language } = useLanguage()

  const quickActions = [
    {
      name: language === 'zh' ? '创建项目' : 'Create project',
      description:
        language === 'zh'
          ? '初始化项目、区域与凭据，立即进入交付流程。'
          : 'Set up a project, region, and credentials to enter delivery flows.',
      action: language === 'zh' ? '进入' : 'Open',
      icon: '▢',
      link: '#',
    },
    {
      name: language === 'zh' ? '打开控制台' : 'Open Console',
      description:
        language === 'zh'
          ? '跳转到统一控制面继续日常运维和审批。'
          : 'Jump into the unified console for operations and approvals.',
      action: language === 'zh' ? '进入' : 'Open',
      icon: '⌘',
      link: '#',
    },
    {
      name: language === 'zh' ? 'GitOps 部署' : 'Deploy via GitOps',
      description:
        language === 'zh'
          ? '使用仓库触发部署，保持声明式发布与回滚。'
          : 'Trigger deployments from repos to keep releases declarative.',
      action: language === 'zh' ? '查看' : 'View',
      icon: '⇵',
      link: '#',
    },
  ]

  const services = [
    {
      name: 'XCloudFlow',
      description:
        language === 'zh'
          ? 'IaC 与 GitOps 中枢，统一治理环境和变更。'
          : 'IaC and GitOps core to govern environments and changes.',
      action: language === 'zh' ? '进入' : 'Open',
      icon: '⛁',
      link: 'https://www.svc.plus/xcloudflow',
    },
    {
      name: 'XScopeHub',
      description:
        language === 'zh'
          ? '观测与 AI 协作中心，连通指标、日志与告警。'
          : 'Monitoring and AI observability hub for metrics, logs, and alerts.',
      action: language === 'zh' ? '查看' : 'View',
      icon: '◉',
      link: 'https://www.svc.plus/xscopehub',
    },
    {
      name: 'XStream',
      description:
        language === 'zh'
          ? '网络与合规加速入口，策略即代码内建护栏。'
          : 'Network acceleration and compliance guardrails with policy as code.',
      action: language === 'zh' ? '查看' : 'View',
      icon: '↯',
      link: 'https://www.svc.plus/xstream',
    },
    {
      name: 'XControl',
      description:
        language === 'zh'
          ? '控制台与身份统一入口，连接所有产品线。'
          : 'Console and IAM gateway connecting every product.',
      action: language === 'zh' ? '进入' : 'Open',
      icon: '☰',
      link: '#',
    },
  ]

  const resources = [
    {
      name: language === 'zh' ? '文档' : 'Documentation',
      description:
        language === 'zh'
          ? '查看 API、控制台与自动化的操作手册。'
          : 'Read the manuals for APIs, console, and automation flows.',
      action: language === 'zh' ? '查看' : 'View',
      icon: '☻',
      link: '/docs',
    },
    {
      name: language === 'zh' ? '示例' : 'Examples',
      description:
        language === 'zh'
          ? '参考模板、蓝图与常见工作流示例。'
          : 'Reference templates, blueprints, and common workflows.',
      action: language === 'zh' ? '查看' : 'View',
      icon: '✎',
      link: '/docs/examples',
    },
    {
      name: language === 'zh' ? 'CLI 工具' : 'CLI Tools',
      description:
        language === 'zh'
          ? '下载并配置 CLI，使用脚本驱动日常操作。'
          : 'Install and configure the CLI to script daily operations.',
      action: language === 'zh' ? '查看' : 'View',
      icon: '⌁',
      link: '/download',
    },
    {
      name: language === 'zh' ? 'API Explorer' : 'API Explorer',
      description:
        language === 'zh'
          ? '通过浏览器探索接口并生成调用示例。'
          : 'Explore APIs in-browser and generate request snippets.',
      action: language === 'zh' ? '打开' : 'Open',
      icon: '⇢',
      link: '/docs/api',
    },
  ]

  const nextSteps = [
    {
      title: language === 'zh' ? '注册应用' : 'Register your app',
      description:
        language === 'zh'
          ? '创建客户端 ID、密钥与回调限制。'
          : 'Create client IDs, secrets, and callback constraints.',
    },
    {
      title: language === 'zh' ? '配置身份' : 'Configure identity',
      description:
        language === 'zh'
          ? '接入身份源、同步组并定义角色。'
          : 'Connect identity sources, sync groups, and define roles.',
    },
    {
      title: language === 'zh' ? '部署基础设施' : 'Deploy your infrastructure',
      description:
        language === 'zh'
          ? '推送 Git 变更触发 IaC 管线与审批。'
          : 'Push Git changes to trigger IaC pipelines and approvals.',
    },
    {
      title: language === 'zh' ? '查看监控' : 'Explore monitoring dashboards',
      description:
        language === 'zh'
          ? '从单一入口查看指标、日志与告警。'
          : 'View metrics, logs, and alerts from one place.',
    },
  ]

  const updates = [
    {
      title: language === 'zh' ? 'XCloudFlow 发布全新环境模板' : 'XCloudFlow ships new environment templates',
      date: '2024-05-12',
      tag: language === 'zh' ? '发布' : 'Release',
      summary:
        language === 'zh'
          ? '标准化 IaC 资产库，支持多集群蓝图与审批链路。'
          : 'Standardized IaC catalogs now support multi-cluster blueprints and approval paths.',
    },
    {
      title: language === 'zh' ? '多云治理指南新增零信任章节' : 'Multi-cloud governance guide adds Zero Trust chapter',
      date: '2024-04-28',
      tag: language === 'zh' ? '指南' : 'Guide',
      summary:
        language === 'zh'
          ? '涵盖跨地域访问控制、网络隔离与策略即代码实践。'
          : 'Covers cross-region access control, network isolation, and policy-as-code patterns.',
    },
    {
      title: language === 'zh' ? '社区发布 GitOps 最佳实践案例集' : 'Community publishes GitOps best-practice kit',
      date: '2024-04-05',
      tag: language === 'zh' ? '社区' : 'Community',
      summary:
        language === 'zh'
          ? '收录三种上线策略、回滚范式与指标告警联动示例。'
          : 'Includes rollout strategies, rollback patterns, and examples linking metrics to alerts.',
    },
  ]

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f6f7f9] text-slate-900">
      <div className={clsx(designTokens.layout.container, 'py-16 lg:py-20')}>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <header className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <span className="rounded-md border border-black/10 px-3 py-1">Console</span>
                  <span className="text-slate-400">{language === 'zh' ? '服务入口' : 'Service entry console'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                  {language === 'zh' ? '运行正常 · 中立多云' : 'Operational · Cloud-neutral'}
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm text-slate-600">
                {language === 'zh'
                  ? '以任务为先的入口，快速跳转到交付、服务与文档，保持冷静的控制台视角。'
                  : 'Task-first entry surface that routes you to delivery, services, and docs with a calm console tone.'}
              </p>
            </header>

            <section className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {language === 'zh' ? '快捷操作' : 'Quick actions'}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                    {language === 'zh' ? '立即开启你的交付流程' : 'Start your delivery flow now'}
                  </h2>
                </div>
                <span className="text-xs text-slate-500">{language === 'zh' ? '任务优先' : 'Task-first focus'}</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {quickActions.map((item) => (
                  <a
                    key={item.name}
                    href={item.link}
                    className="flex h-full flex-col justify-between rounded-md border border-black/10 bg-[#f8f9fb] p-4 transition hover:bg-[#eef1f6]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-sm border border-black/10 text-sm text-slate-700">
                        {item.icon}
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-[13px] leading-snug text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2f54c1]">
                      {item.action}
                      <span aria-hidden>→</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {language === 'zh' ? '云中立服务' : 'Cloud-neutral services'}
                </p>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {language === 'zh' ? '按产品线进入控制面' : 'Enter control planes by product'}
                </h2>
                <p className="text-sm text-slate-600">
                  {language === 'zh'
                    ? '用整齐的卡片分发到各产品，保持无渐变、无装饰的控制台视觉。'
                    : 'Structured cards route to each product with a calm, decoration-free console tone.'}
                </p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {services.map((item) => (
                  <a
                    key={item.name}
                    href={item.link}
                    className="flex h-full flex-col justify-between rounded-md border border-black/10 bg-[#f8f9fb] p-4 transition hover:bg-[#eef1f6]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-sm border border-black/10 text-sm text-slate-700">
                        {item.icon}
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-[13px] leading-snug text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2f54c1]">
                      {item.action}
                      <span aria-hidden>→</span>
                    </span>
                  </a>
                ))}
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
              <div className="mt-6 grid gap-3 md:grid-cols-4">
                {nextSteps.map((step) => (
                  <div key={step.title} className="flex flex-col gap-3 rounded-md border border-black/10 bg-[#f8f9fb] p-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-xs font-semibold text-[#2f54c1]">
                      ↺
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                      <p className="text-[13px] leading-snug text-slate-600">{step.description}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f54c1]">
                      {language === 'zh' ? '前往' : 'Go to step'}
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {language === 'zh' ? '资源与工具' : 'Resources & tools'}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                    {language === 'zh' ? '支撑你完成操作的文档与工具' : 'Docs and tools that support your tasks'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {language === 'zh'
                      ? '保持无装饰的入口，聚焦任务、服务与文档的顺序层级。'
                      : 'Neutral, undecorated entry points that focus on tasks, services, and documentation hierarchy.'}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {resources.map((item) => (
                  <a
                    key={item.name}
                    href={item.link}
                    className="flex h-full flex-col justify-between rounded-md border border-black/10 bg-[#f8f9fb] p-4 transition hover:bg-[#eef1f6]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-sm border border-black/10 text-sm text-slate-700">
                        {item.icon}
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-[13px] leading-snug text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2f54c1]">
                      {item.action}
                      <span aria-hidden>→</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-black/10 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {language === 'zh' ? '博客与更新' : 'Blog & updates'}
                </p>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {language === 'zh' ? '近期动态' : 'Recent activity'}
                </h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {updates.map((item) => (
                  <article
                    key={item.title}
                    className="flex h-full flex-col justify-between rounded-md border border-black/10 bg-[#f8f9fb] p-4"
                  >
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                      <span className="rounded-full border border-black/10 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        {item.tag}
                      </span>
                      <span className="text-xs text-slate-500">{item.date}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-[13px] leading-snug text-slate-600">{item.summary}</p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2f54c1]">
                      {language === 'zh' ? '查看' : 'View'}
                      <span aria-hidden>→</span>
                    </span>
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
