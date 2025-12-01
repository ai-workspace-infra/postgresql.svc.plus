'use client'

export const dynamic = 'error'

import { useLanguage } from '@i18n/LanguageProvider'
import {
  ActivitySquare,
  AppWindow,
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  CloudCog,
  Command,
  Compass,
  ExternalLink,
  Github,
  Globe2,
  GraduationCap,
  Layers,
  Link2,
  PanelsTopLeft,
  ShieldCheck,
  Terminal,
  TrendingUp,
} from 'lucide-react'
import { useMemo, type ElementType, type ReactNode } from 'react'

type CardItem = {
  title: string
  description: string
  href: string
}

type ProductItem = CardItem & { icon: ElementType }
type QuickActionItem = ProductItem
type ChecklistItem = ProductItem & { badge: string }
type ResourceItem = ProductItem
type UpdateItem = ProductItem & { tag: string; date: string }

const cardClasses =
  'group relative rounded-xl border border-gray-200/80 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'

export default function HomePage() {
  const { language, setLanguage } = useLanguage()

  const copy = useMemo(() => {
    if (language === 'zh') {
      return {
        consoleTitle: 'Cloud-Neutral 控制台',
        consoleSubtitle: '针对多云工作负载的统一入口。',
        openConsole: '打开控制台',
        quickActions: '快捷操作',
        productMatrix: '产品矩阵',
        nextSteps: '下一步',
        resources: '资源',
        updates: '更新',
        languageLabel: '语言',
      }
    }
    return {
      consoleTitle: 'Cloud-Neutral Console',
      consoleSubtitle: 'Unified entry for cloud-neutral workloads.',
      openConsole: 'Open Console',
      quickActions: 'Quick Actions',
      productMatrix: 'Product Matrix',
      nextSteps: 'Next Steps',
      resources: 'Resources',
      updates: 'Updates',
      languageLabel: 'Language',
    }
  }, [language])

  const quickActions: QuickActionItem[] = [
    {
      title: language === 'zh' ? '打开控制台' : 'Open Console',
      description: language === 'zh'
        ? '进入统一管理控制台。'
        : 'Enter the unified management console.',
      href: '/panel',
      icon: PanelsTopLeft,
    },
    {
      title: language === 'zh' ? '通过 GitOps 部署' : 'Deploy via GitOps',
      description: language === 'zh'
        ? '连接代码仓库并持续同步环境。'
        : 'Connect repositories and continuously sync environments.',
      href: '/cloud_iac',
      icon: Command,
    },
  ]

  const products: ProductItem[] = [
    {
      title: 'XCloudFlow',
      description: language === 'zh' ? '交付与发布流水线。' : 'Delivery and rollout pipelines.',
      href: '/panel',
      icon: Layers,
    },
    {
      title: 'XStream',
      description: language === 'zh' ? '事件流与可观测聚合。' : 'Event stream and observability aggregation.',
      href: '/insight',
      icon: ActivitySquare,
    },
    {
      title: 'XScopeHub',
      description: language === 'zh' ? '资产拓扑与依赖视图。' : 'Asset topology and dependency views.',
      href: '/cloud_iac',
      icon: Compass,
    },
    {
      title: 'XControl',
      description: language === 'zh' ? '身份、访问与策略治理。' : 'Identity, access, and policy governance.',
      href: '/account',
      icon: ShieldCheck,
    },
  ]

  const checklist: ChecklistItem[] = [
    {
      badge: language === 'zh' ? '身份' : 'Identity',
      title: language === 'zh' ? '配置身份' : 'Configure Identity',
      description: language === 'zh' ? '绑定身份源并设置登录策略。' : 'Bind identity sources and sign-in policies.',
      href: '/account/connections',
      icon: ShieldCheck,
    },
    {
      badge: language === 'zh' ? '应用' : 'Apps',
      title: language === 'zh' ? '注册应用' : 'Register an App',
      description: language === 'zh' ? '创建客户端并配置回调。' : 'Create clients and configure callbacks.',
      href: '/account/applications',
      icon: Box,
    },
    {
      badge: language === 'zh' ? '部署' : 'Deploy',
      title: language === 'zh' ? '部署基础设施' : 'Deploy Infrastructure',
      description: language === 'zh' ? '同步 IaC 定义并推送策略。' : 'Sync IaC definitions and push policies.',
      href: '/cloud_iac',
      icon: CloudCog,
    },
    {
      badge: language === 'zh' ? '监控' : 'Monitoring',
      title: language === 'zh' ? '查看监控面板' : 'View Monitoring Dashboards',
      description: language === 'zh' ? '聚合指标、日志与追踪视图。' : 'Aggregate metrics, logs, and traces.',
      href: '/insight',
      icon: TrendingUp,
    },
  ]

  const resources: ResourceItem[] = [
    {
      title: language === 'zh' ? 'CLI 工具' : 'CLI Tools',
      description: language === 'zh' ? '使用命令行快速管理资源。' : 'Manage resources quickly from the CLI.',
      href: '/docs/cli',
      icon: Terminal,
    },
    {
      title: language === 'zh' ? '文档中心' : 'Documentation',
      description: language === 'zh' ? '浏览控制平面与 API 指南。' : 'Browse control plane and API guides.',
      href: '/docs',
      icon: BookOpen,
    },
    {
      title: language === 'zh' ? '示例与模板' : 'Examples',
      description: language === 'zh' ? '复用配置片段与最佳实践。' : 'Reuse configuration snippets and best practices.',
      href: '/docs/examples',
      icon: AppWindow,
    },
    {
      title: language === 'zh' ? 'API Explorer' : 'API Explorer',
      description: language === 'zh' ? '交互测试 REST 与 SDK。' : 'Interactively test REST and SDK calls.',
      href: '/docs/api',
      icon: Link2,
    },
  ]

  const updates: UpdateItem[] = [
    {
      tag: language === 'zh' ? '发布' : 'RELEASE',
      date: '2025-02-10',
      title: language === 'zh' ? 'XCloudFlow 守护批次' : 'XCloudFlow batch guardians',
      description: language === 'zh'
        ? '自动为批次应用回滚与审批模板。'
        : 'Automatically apply rollback and approval templates to each batch.',
      href: '/blog/cloudflow-guardians',
      icon: CheckCircle2,
    },
    {
      tag: language === 'zh' ? '指南' : 'GUIDE',
      date: '2025-01-28',
      title: language === 'zh' ? '零信任入口蓝图' : 'Zero-trust entry blueprint',
      description: language === 'zh'
        ? '统一入口、流量审计与策略推送实践。'
        : 'Unified entry, traffic audit, and policy push practices.',
      href: '/blog/zero-trust-blueprint',
      icon: GraduationCap,
    },
    {
      tag: language === 'zh' ? '博客' : 'BLOG',
      date: '2025-01-12',
      title: language === 'zh' ? '跨云观测路径' : 'Cross-cloud observability paths',
      description: language === 'zh'
        ? '在多云环境对齐指标与告警域。'
        : 'Align metrics and alert domains across clouds.',
      href: '/blog/cross-cloud-observability',
      icon: ArrowRight,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <ConsoleHeader
        languageLabel={copy.languageLabel}
        currentLanguage={language}
        onLanguageChange={setLanguage}
      />
      <main className="mx-auto max-w-6xl space-y-16 px-6 pb-20 pt-12">
        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{copy.consoleTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{copy.consoleSubtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <a
              href="/panel"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <PanelsTopLeft className="h-4 w-4" aria-hidden />
              {copy.openConsole}
            </a>
            <a
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              Docs
            </a>
          </div>
        </section>

        <Section
          title={copy.quickActions}
          description={language === 'zh' ? '快捷入口，直接落地操作。' : 'Shortcut cards for immediate actions.'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quickActions.map((item) => (
              <ShortcutCard key={item.title} {...item} />
            ))}
          </div>
        </Section>

        <Section
          title={copy.productMatrix}
          description={language === 'zh' ? '核心模块的统一入口。' : 'Primary modules, accessible in one place.'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((item) => (
              <ProductCard key={item.title} {...item} />
            ))}
          </div>
        </Section>

        <Section
          title={copy.nextSteps}
          description={language === 'zh' ? '按顺序完成基础配置。' : 'Complete the onboarding checklist.'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {checklist.map((item) => (
              <ChecklistCard key={item.title} {...item} />
            ))}
          </div>
        </Section>

        <Section
          title={copy.resources}
          description={language === 'zh' ? '文档与工具的快速集合。' : 'Documentation and tools in one place.'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resources.map((item) => (
              <ResourceCard key={item.title} {...item} />
            ))}
          </div>
        </Section>

        <Section
          title={copy.updates}
          description={language === 'zh' ? '最新发布与实践指南。' : 'Recent releases and guides.'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {updates.map((item) => (
              <UpdateCard
                key={item.title}
                learnMoreLabel={language === 'zh' ? '了解更多' : 'Learn more'}
                {...item}
              />
            ))}
          </div>
        </Section>
      </main>
      <ConsoleFooter />
    </div>
  )
}

type HeaderProps = {
  languageLabel: string
  currentLanguage: 'en' | 'zh'
  onLanguageChange: (lang: 'en' | 'zh') => void
}

function ConsoleHeader({ languageLabel, currentLanguage, onLanguageChange }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 text-sm text-slate-700 dark:text-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
            <Globe2 className="h-5 w-5" aria-hidden />
            <span>Cloud-Neutral</span>
          </div>
          <nav className="hidden items-center gap-3 text-xs font-medium text-slate-500 sm:flex dark:text-slate-400">
            <span className="rounded-md px-2 py-1 hover:text-slate-800 dark:hover:text-slate-100">Console</span>
            <span className="rounded-md px-2 py-1 hover:text-slate-800 dark:hover:text-slate-100">Docs</span>
            <span className="rounded-md px-2 py-1 hover:text-slate-800 dark:hover:text-slate-100">Releases</span>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <Terminal className="h-4 w-4" aria-hidden />
            <span>⌘K</span>
          </div>
          <div
            aria-label={languageLabel}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-slate-700 dark:border-slate-800 dark:text-slate-200"
          >
            <Globe2 className="h-4 w-4" aria-hidden />
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={currentLanguage === 'en' ? 'font-semibold text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}
            >
              EN
            </button>
            <span className="text-gray-300 dark:text-slate-600">/</span>
            <button
              type="button"
              onClick={() => onLanguageChange('zh')}
              className={currentLanguage === 'zh' ? 'font-semibold text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}
            >
              中文
            </button>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
        </div>
      </div>
    </header>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  )
}

function ShortcutCard({ title, description, href, icon: Icon }: QuickActionItem) {
  return (
    <a href={href} className={cardClasses}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          <div className="flex items-center justify-end text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <span>Open</span>
              <ExternalLink className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

function ProductCard({ title, description, href, icon: Icon }: ProductItem) {
  return (
    <a href={href} className={cardClasses}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <span>Open</span>
            <ExternalLink className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}

function ChecklistCard({ badge, title, description, href, icon: Icon }: ChecklistItem) {
  return (
    <a href={href} className={cardClasses}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-2">
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {badge}
            </span>
            <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <span>Start</span>
            <ExternalLink className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}

function ResourceCard({ title, description, href, icon: Icon }: ResourceItem) {
  return (
    <a href={href} className={cardClasses}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <span>Open</span>
            <ExternalLink className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}

function UpdateCard({ tag, date, title, description, href, icon: Icon, learnMoreLabel }: UpdateItem & { learnMoreLabel: string }) {
  return (
    <a href={href} className={cardClasses}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-300">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{tag}</span>
              <span className="text-slate-400 dark:text-slate-500">{date}</span>
            </div>
            <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <span>{learnMoreLabel}</span>
            <ExternalLink className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}

function ConsoleFooter() {
  const socials = [
    { label: 'GitHub', icon: Github, href: 'https://github.com' },
    { label: 'Globe', icon: Globe2, href: 'https://cloud-neutral.example.com' },
    { label: 'Docs', icon: BookOpen, href: '/docs' },
  ]

  return (
    <footer className="mt-20 bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-300">© 2025 Cloud-Neutral</div>
          <div className="flex items-center gap-3">
            {socials.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-white/40 hover:text-white"
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="sr-only">{label}</span>
              </a>
            ))}
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/40">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <span>Theme</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
