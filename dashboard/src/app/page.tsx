'use client'

export const dynamic = 'error'

import { useLanguage } from '@i18n/LanguageProvider'
import {
  AppWindow,
  ArrowUpRightSquare,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Command,
  Compass,
  Discord,
  FileText,
  Github,
  Globe,
  Languages,
  LayoutPanelLeft,
  LayoutTemplate,
  Link2,
  LucideIcon,
  Network,
  Search,
  Server,
  Shield,
  Terminal,
  Twitter,
  UserRound,
  Wand2,
  Youtube,
} from 'lucide-react'
import { useMemo } from 'react'

const cardBaseClass =
  'rounded-[4px] border border-black/[0.07] bg-white p-4 text-[13px] transition hover:bg-slate-50'

export default function HomePage() {
  const { language, setLanguage } = useLanguage()

  const copy = useMemo(() => {
    if (language === 'zh') {
      return {
        tabs: ['主页', '文档', '下载', '开源', '更多服务'],
        search: '搜索',
        consoleTitle: 'Cloud-Neutral 控制台',
        consoleSubtitle: '统一的多云控制界面。',
        openConsole: '打开控制台',
        docs: '文档',
        quickActions: '快捷操作',
        productMatrix: '产品矩阵',
        nextSteps: '下一步',
        resources: '资源',
        updates: '更新',
        languageLabel: '语言',
      }
    }
    return {
      tabs: ['Home', 'Docs', 'Download', 'Open Source', 'More Services'],
      search: 'Search',
      consoleTitle: 'Cloud-Neutral Console',
      consoleSubtitle: 'Unified multi-cloud control surface.',
      openConsole: 'Open Console',
      docs: 'Documentation',
      quickActions: 'Quick actions',
      productMatrix: 'Product matrix',
      nextSteps: 'Next steps',
      resources: 'Resources',
      updates: 'Updates',
      languageLabel: 'Language',
    }
  }, [language])

  const quickActions: CardItem[] = [
    {
      title: language === 'zh' ? '创建项目' : 'Create project',
      description: language === 'zh' ? '设置新的 Cloud-Neutral 项目。' : 'Set up a new Cloud-Neutral project.',
      href: '/panel/projects/new',
      icon: Command,
    },
    {
      title: language === 'zh' ? '打开控制台' : 'Open console',
      description: language === 'zh' ? '进入控制台管理所有模块。' : 'Enter the console to manage all modules.',
      href: '/panel',
      icon: Shield,
    },
    {
      title: language === 'zh' ? '通过 GitOps 部署' : 'Deploy via GitOps',
      description: language === 'zh' ? '连接仓库并同步环境。' : 'Connect repositories and sync environments.',
      href: '/cloud_iac/gitops',
      icon: Terminal,
    },
  ]

  const products: ProductItem[] = [
    {
      title: 'XCloudFlow',
      description: language === 'zh' ? '交付与发布流水线。' : 'Delivery and rollout pipelines.',
      href: '/panel',
      icon: LayoutTemplate,
    },
    {
      title: 'XStream',
      description: language === 'zh' ? '事件流与可观测聚合。' : 'Event stream and observability aggregation.',
      href: '/insight',
      icon: Network,
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
      icon: LayoutPanelLeft,
    },
  ]

  const checklist: ChecklistItem[] = [
    {
      tag: language === 'zh' ? '身份' : 'Identity',
      title: language === 'zh' ? '配置身份' : 'Configure identity',
      description: language === 'zh' ? '接入身份源并定义登录策略。' : 'Connect identity sources and sign-in policies.',
      href: '/account/connections',
      icon: ClipboardList,
    },
    {
      tag: language === 'zh' ? '应用' : 'Applications',
      title: language === 'zh' ? '注册应用' : 'Register an app',
      description: language === 'zh' ? '创建客户端并配置回调。' : 'Create clients and configure callbacks.',
      href: '/account/applications',
      icon: Boxes,
    },
    {
      tag: language === 'zh' ? '部署' : 'Deploy',
      title: language === 'zh' ? '部署基础设施' : 'Deploy infrastructure',
      description: language === 'zh' ? '同步 IaC 定义并推送策略。' : 'Sync IaC definitions and push policies.',
      href: '/cloud_iac',
      icon: Server,
    },
    {
      tag: language === 'zh' ? '监控' : 'Monitoring',
      title: language === 'zh' ? '查看监控面板' : 'View monitoring dashboards',
      description: language === 'zh' ? '聚合指标、日志与追踪视图。' : 'Aggregate metrics, logs, and traces.',
      href: '/insight',
      icon: CheckCircle2,
    },
  ]

  const resources: CardItem[] = [
    {
      title: language === 'zh' ? 'CLI 工具' : 'CLI Tools',
      description: language === 'zh' ? '使用命令行快速管理资源。' : 'Use the CLI to manage resources quickly.',
      href: '/docs/cli',
      icon: Terminal,
    },
    {
      title: language === 'zh' ? '文档中心' : 'Documentation',
      description: language === 'zh' ? '浏览控制平面与 API 指南。' : 'Explore control plane and API guides.',
      href: '/docs',
      icon: BookOpen,
    },
    {
      title: language === 'zh' ? '示例与模板' : 'Examples',
      description: language === 'zh' ? '复用配置片段与最佳实践。' : 'Reuse configuration snippets and best practices.',
      href: '/docs/examples',
      icon: Wand2,
    },
    {
      title: language === 'zh' ? 'API Explorer' : 'API Explorer',
      description: language === 'zh' ? '交互测试 REST 与 SDK。' : 'Interactively test REST and SDK calls.',
      href: '/docs/api',
      icon: AppWindow,
    },
  ]

  const updates: UpdateItem[] = [
    {
      tag: language === 'zh' ? '发布' : 'Release',
      date: '2025-02-10',
      title: language === 'zh' ? 'XCloudFlow 批次守护' : 'XCloudFlow batch guardians',
      description: language === 'zh'
        ? '为每个批次自动应用回滚与审批模板。'
        : 'Apply rollback and approval templates automatically to each batch.',
      href: '/blog/cloudflow-guardians',
      icon: CheckCircle2,
    },
    {
      tag: language === 'zh' ? '指南' : 'Guide',
      date: '2025-01-28',
      title: language === 'zh' ? '零信任入口蓝图' : 'Zero-trust entry blueprint',
      description: language === 'zh' ? '统一入口、流量审计与策略推送实践。' : 'Unified entry, traffic audit, and policy push practices.',
      href: '/blog/zero-trust-blueprint',
      icon: FileText,
    },
    {
      tag: 'Blog',
      date: '2025-01-12',
      title: language === 'zh' ? '跨云观测路径' : 'Cross-cloud observability paths',
      description: language === 'zh' ? '在多云环境对齐指标与告警域。' : 'Align metrics and alert domains across clouds.',
      href: '/blog/cross-cloud-observability',
      icon: Link2,
    },
  ]

  const productOpenLabel = language === 'zh' ? '打开' : 'Open'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SystemNavbar
        tabs={copy.tabs}
        searchLabel={copy.search}
        languageLabel={copy.languageLabel}
        currentLanguage={language}
        onLanguageChange={setLanguage}
      />
      <main className="max-w-[1100px] mx-auto px-4 py-10 space-y-10">
        <section className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">{copy.consoleTitle}</h1>
            <p className="text-sm text-slate-500">{copy.consoleSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <a
              href="/panel"
              className="inline-flex items-center gap-2 rounded-[4px] border border-black/[0.07] bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50"
            >
              <ArrowUpRightSquare className="h-3.5 w-3.5" aria-hidden />
              {copy.openConsole}
            </a>
            <a
              href="/docs"
              className="inline-flex items-center gap-2 rounded-[4px] border border-black/[0.07] bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {copy.docs}
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.65fr_1fr]">
          <div className="space-y-3">
            <SectionTitle label={copy.quickActions} />
            <div className="space-y-3">
              {quickActions.map((item) => (
                <ActionCard key={item.title} {...item} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <SectionTitle label={copy.productMatrix} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {products.map((item) => (
                <ProductCard key={item.title} {...item} openLabel={productOpenLabel} />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle label={copy.nextSteps} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {checklist.map((item) => (
              <ChecklistCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <SectionTitle label={copy.resources} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {resources.map((item) => (
                <ActionCard key={item.title} {...item} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <SectionTitle label={copy.updates} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {updates.map((item) => (
                <UpdateCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <ConsoleFooter />
    </div>
  )
}

type CardItem = {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

type ProductItem = CardItem

interface ProductCardProps extends ProductItem {
  openLabel: string
}

interface ChecklistItem extends CardItem {
  tag: string
}

interface UpdateItem extends CardItem {
  tag: string
  date: string
}

type NavbarProps = {
  tabs: string[]
  searchLabel: string
  languageLabel: string
  currentLanguage: 'en' | 'zh'
  onLanguageChange: (lang: 'en' | 'zh') => void
}

function SystemNavbar({ tabs, searchLabel, languageLabel, currentLanguage, onLanguageChange }: NavbarProps) {
  return (
    <header className="border-b border-black/[0.08] bg-white">
      <div className="mx-auto flex h-10 max-w-[1100px] items-center justify-between px-4 text-[13px] font-semibold text-slate-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-900">
            <Globe className="h-4 w-4" aria-hidden />
            <span className="text-sm">XControl</span>
          </div>
          <nav className="flex items-center gap-3">
            {tabs.map((tab) => (
              <a key={tab} href="#" className="rounded px-1 py-1 transition hover:text-slate-900 hover:underline">
                {tab}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded border border-black/[0.08] px-2 py-1 text-slate-600">
            <Search className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[12px]">{searchLabel}</span>
            <kbd className="rounded border border-black/[0.12] bg-slate-100 px-1 text-[11px] text-slate-700">/</kbd>
          </div>
          <div
            aria-label={languageLabel}
            className="flex items-center gap-1 rounded border border-black/[0.08] px-2 py-1 text-[12px] text-slate-700"
          >
            <Languages className="h-3.5 w-3.5" aria-hidden />
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-1 ${currentLanguage === 'en' ? 'text-slate-900 underline' : 'text-slate-600 hover:text-slate-900'}`}
            >
              EN
            </button>
            <span className="text-black/30">|</span>
            <button
              type="button"
              onClick={() => onLanguageChange('zh')}
              className={`px-1 ${currentLanguage === 'zh' ? 'text-slate-900 underline' : 'text-slate-600 hover:text-slate-900'}`}
            >
              中文
            </button>
            <ChevronDown className="h-3 w-3" aria-hidden />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-800">
            <UserRound className="h-4 w-4" aria-hidden />
          </div>
        </div>
      </div>
    </header>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="h-2 w-2 rounded-full bg-slate-900" aria-hidden />
      {label}
    </div>
  )
}

function ActionCard({ title, description, href, icon: Icon }: CardItem) {
  return (
    <a className={cardBaseClass} href={href}>
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-800">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">{title}</div>
          <p className="text-slate-600">{description}</p>
        </div>
      </div>
    </a>
  )
}

function ProductCard({ title, description, href, icon: Icon, openLabel }: ProductCardProps) {
  return (
    <a className={cardBaseClass} href={href}>
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-800">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">{title}</div>
          <p className="text-slate-600">{description}</p>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700">
            {openLabel}
            <ArrowUpRightSquare className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}

function ChecklistCard({ tag, title, description, href, icon: Icon }: ChecklistItem) {
  return (
    <a className={cardBaseClass} href={href}>
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-800">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="space-y-1">
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-700">
            {tag}
          </span>
          <div className="font-semibold text-slate-900">{title}</div>
          <p className="text-slate-600">{description}</p>
        </div>
      </div>
    </a>
  )
}

function UpdateCard({ tag, date, title, description, href, icon: Icon }: UpdateItem) {
  return (
    <a className={cardBaseClass} href={href}>
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-800">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-slate-700">
            <span className="rounded bg-slate-100 px-2 py-0.5">{tag}</span>
            <span className="text-slate-500">{date}</span>
          </div>
          <div className="font-semibold text-slate-900">{title}</div>
          <p className="text-slate-600">{description}</p>
        </div>
        <ArrowUpRightSquare className="ml-auto h-4 w-4 text-slate-400" aria-hidden />
      </div>
    </a>
  )
}

function ConsoleFooter() {
  const socials = [
    { label: 'GitHub', icon: Github, href: 'https://github.com' },
    { label: 'X', icon: Twitter, href: 'https://x.com' },
    { label: 'LinkedIn', icon: Globe, href: 'https://www.linkedin.com' },
    { label: 'Discord', icon: Discord, href: 'https://discord.com' },
    { label: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
  ]

  return (
    <footer className="mt-10 bg-[#0f121a] text-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 py-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-300">
          <div className="flex items-center gap-2">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <span className="text-slate-500">/</span>
            <a href="#" className="hover:text-white">
              Terms
            </a>
            <span className="text-slate-500">/</span>
            <a href="#" className="hover:text-white">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-3">
            {socials.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-white/40 hover:text-white"
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="sr-only">{label}</span>
              </a>
            ))}
            <button className="inline-flex items-center gap-2 rounded border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-white/40">
              <Globe className="h-4 w-4" aria-hidden />
              <span>Theme</span>
              <ChevronDown className="h-3 w-3" aria-hidden />
            </button>
          </div>
        </div>
        <div className="text-left text-[12px] text-slate-400">© 2025 Cloud-Neutral</div>
      </div>
    </footer>
  )
}
