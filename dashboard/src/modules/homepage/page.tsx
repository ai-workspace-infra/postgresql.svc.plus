'use client'

import { useThemeStore } from '@components/theme'

import { useLanguage } from '../../i18n/LanguageProvider'

type QuickAction = {
  name: string
  description: string
  action: string
  icon: string
  link: string
}

type Service = QuickAction

type Resource = QuickAction

type NextStep = {
  title: string
  description: string
}

type Update = {
  title: string
  date: string
  tag: string
  summary: string
}

const sectionCardClass =
  'rounded-2xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-elevated)] p-6 text-[color:var(--color-text)] shadow-[var(--shadow-md)]'

export default function Homepage() {
  const { language, setLanguage } = useLanguage()
  const theme = useThemeStore((state) => state.theme)
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const quickActions: QuickAction[] = [
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

  const services: Service[] = [
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

  const resources: Resource[] = [
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

  const nextSteps: NextStep[] = [
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

  const updates: Update[] = [
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
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-text)] transition-colors">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 font-semibold text-[color:var(--color-text-subtle)]">
            <span>{language === 'zh' ? '语言' : 'Language'}</span>
            <div className="inline-flex overflow-hidden rounded-full border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)]">
              {(
                [
                  { value: 'zh', label: '中' },
                  { value: 'en', label: 'EN' },
                ] as const
              ).map((option) => {
                const active = language === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLanguage(option.value)}
                    className={`px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]'
                        : 'text-[color:var(--color-text-subtle)] hover:bg-[color:var(--color-surface-muted)]'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 font-semibold text-[color:var(--color-text-subtle)]">
            <span>{language === 'zh' ? '主题' : 'Theme'}</span>
            <div className="inline-flex overflow-hidden rounded-full border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)]">
              {(
                [
                  { value: 'light', label: language === 'zh' ? '明' : 'Light' },
                  { value: 'dark', label: language === 'zh' ? '暗' : 'Dark' },
                  { value: 'system', label: language === 'zh' ? '系统' : 'System' },
                ] as const
              ).map((option) => {
                const active =
                  theme === option.value ||
                  (option.value !== 'system' && theme === 'system' && resolvedTheme === option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      option.value === 'light' || option.value === 'dark'
                        ? setTheme(option.value)
                        : setTheme('system')
                    }
                    className={`px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]'
                        : 'text-[color:var(--color-text-subtle)] hover:bg-[color:var(--color-surface-muted)]'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-[color:var(--color-surface-border)] px-3 py-1 text-[11px] font-semibold text-[color:var(--color-text-subtle)] transition-colors hover:border-[color:var(--color-primary-border)] hover:text-[color:var(--color-primary)]"
            >
              {language === 'zh'
                ? resolvedTheme === 'dark'
                  ? '切换为浅色'
                  : '切换为深色'
                : resolvedTheme === 'dark'
                  ? 'Switch to light'
                  : 'Switch to dark'}
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-surface-border)] bg-[linear-gradient(135deg,var(--gradient-app-from),var(--gradient-app-to))] p-8 text-[color:var(--color-text)] shadow-[var(--shadow-md)]">
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-text-subtle)]">
              {language === 'zh' ? '控制台入口' : 'Console entry stream'}
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-[color:var(--color-heading)] sm:text-3xl">
              {language === 'zh' ? '从这里开始统一管理' : 'Start orchestrating from one console'}
            </h1>
            <p className="text-sm text-[color:var(--color-text-subtle)] sm:max-w-3xl">
              {language === 'zh'
                ? '快速进入项目、身份与交付入口，保持清晰的纵向信息流。'
                : 'Move through projects, identity, and delivery entry points with a clear vertical flow.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-[color:var(--color-primary)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-muted)] px-3 py-1 font-semibold">
                {language === 'zh' ? '创建应用' : 'Create application'}
                <span aria-hidden>→</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-muted)] px-3 py-1 font-semibold">
                {language === 'zh' ? '了解更多' : 'Learn more'}
                <span aria-hidden>↗</span>
              </span>
            </div>
          </div>
        </div>
        <QuickActionsSection quickActions={quickActions} language={language} />
        <ServiceEntryGrid services={services} language={language} />
        <NextSteps steps={nextSteps} language={language} />
        <Resources resources={resources} language={language} />
        <BlogUpdates updates={updates} language={language} />
      </main>
    </div>
  )
}

type SectionProps = {
  language: 'zh' | 'en'
}

function QuickActionsSection({ quickActions, language }: SectionProps & { quickActions: QuickAction[] }) {
  return (
    <section className={sectionCardClass}>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
            {language === 'zh' ? '快捷操作' : 'Quick actions'}
          </p>
          <h2 className="text-lg font-semibold text-[color:var(--color-heading)] sm:text-xl">
            {language === 'zh' ? '快速进入常用任务' : 'Jump into routine tasks'}
          </h2>
        </div>
        <span className="text-[12px] text-[color:var(--color-text-subtle)]">
          {language === 'zh' ? '任务优先' : 'Task-first'}
        </span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {quickActions.map((item) => (
          <a
            key={item.name}
            href={item.link}
            className="flex h-full flex-col justify-between rounded-xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)] p-4 text-[color:var(--color-text)] transition hover:-translate-y-1 hover:border-[color:var(--color-primary-border)] hover:bg-[color:var(--color-surface-muted)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-muted)] text-sm text-[color:var(--color-text)]">
                {item.icon}
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[color:var(--color-heading)]">{item.name}</h3>
                <p className="text-[13px] leading-snug text-[color:var(--color-text-subtle)]">{item.description}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--color-primary)]">
              {item.action}
              <span aria-hidden>→</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

function ServiceEntryGrid({ services, language }: SectionProps & { services: Service[] }) {
  return (
    <section className={sectionCardClass}>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
          {language === 'zh' ? '云中立服务' : 'Cloud-neutral services'}
        </p>
        <h2 className="text-lg font-semibold text-[color:var(--color-heading)] sm:text-xl">
          {language === 'zh' ? '进入各产品控制面' : 'Enter control planes'}
        </h2>
        <p className="text-[13px] text-[color:var(--color-text-subtle)]">
          {language === 'zh'
            ? '保持无渐变、无装饰的卡片布局，突出入口清晰度。'
            : 'Calm, decoration-free cards that keep entry points clear.'}
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((item) => (
          <a
            key={item.name}
            href={item.link}
            className="flex h-full flex-col justify-between rounded-xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)] p-4 text-[color:var(--color-text)] transition hover:-translate-y-1 hover:border-[color:var(--color-primary-border)] hover:bg-[color:var(--color-surface-muted)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-muted)] text-sm text-[color:var(--color-text)]">
                {item.icon}
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[color:var(--color-heading)]">{item.name}</h3>
                <p className="text-[13px] leading-snug text-[color:var(--color-text-subtle)]">{item.description}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--color-primary)]">
              {item.action}
              <span aria-hidden>→</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

function NextSteps({ steps, language }: SectionProps & { steps: NextStep[] }) {
  return (
    <section className={sectionCardClass}>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
          {language === 'zh' ? '下一步' : 'Your next steps'}
        </p>
        <h2 className="text-lg font-semibold text-[color:var(--color-heading)] sm:text-xl">
          {language === 'zh' ? '按步骤完成配置' : 'Complete the guided setup'}
        </h2>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex h-full flex-col gap-3 rounded-xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)] p-4"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-muted)] text-xs font-semibold text-[color:var(--color-primary)]">
              ↺
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[color:var(--color-heading)]">{step.title}</h3>
              <p className="text-[13px] leading-snug text-[color:var(--color-text-subtle)]">{step.description}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--color-primary)]">
              {language === 'zh' ? '前往' : 'Go to step'}
              <span aria-hidden>→</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Resources({ resources, language }: SectionProps & { resources: Resource[] }) {
  return (
    <section className={sectionCardClass}>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
          {language === 'zh' ? '资源与工具' : 'Resources & tools'}
        </p>
        <h2 className="text-lg font-semibold text-[color:var(--color-heading)] sm:text-xl">
          {language === 'zh' ? '支撑任务的工具集' : 'Toolbox for your tasks'}
        </h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resources.map((item) => (
          <a
            key={item.name}
            href={item.link}
            className="flex h-full flex-col justify-between rounded-xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)] p-4 text-[color:var(--color-text)] transition hover:-translate-y-1 hover:border-[color:var(--color-primary-border)] hover:bg-[color:var(--color-surface-muted)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-muted)] text-sm text-[color:var(--color-text)]">
                {item.icon}
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[color:var(--color-heading)]">{item.name}</h3>
                <p className="text-[13px] leading-snug text-[color:var(--color-text-subtle)]">{item.description}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--color-primary)]">
              {item.action}
              <span aria-hidden>→</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

function BlogUpdates({ updates, language }: SectionProps & { updates: Update[] }) {
  return (
    <section className={sectionCardClass}>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
          {language === 'zh' ? '博客与更新' : 'Blog & updates'}
        </p>
        <h2 className="text-lg font-semibold text-[color:var(--color-heading)] sm:text-xl">
          {language === 'zh' ? '近期动态' : 'Recent activity'}
        </h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {updates.map((item) => (
          <article
            key={item.title}
            className="flex h-full flex-col justify-between rounded-xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)] p-4 text-[color:var(--color-text)]"
          >
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-[color:var(--color-text-subtle)]">
              <span className="rounded-full border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[color:var(--color-heading)]">
                {item.tag}
              </span>
              <span className="text-xs text-[color:var(--color-text-subtle)]">{item.date}</span>
            </div>
            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-semibold text-[color:var(--color-heading)]">{item.title}</h3>
              <p className="text-[13px] leading-snug text-[color:var(--color-text-subtle)]">{item.summary}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--color-primary)]">
              {language === 'zh' ? '查看' : 'View'}
              <span aria-hidden>→</span>
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
