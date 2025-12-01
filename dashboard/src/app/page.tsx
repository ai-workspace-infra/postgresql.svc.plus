'use client'

export const dynamic = 'error'

import { useLanguage } from '@i18n/LanguageProvider'
import {
  Api,
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
  ListChecks,
  LucideIcon,
  Network,
  Search,
  Server,
  Shield,
  SquareArrowOutUpRight,
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
        quickActions: '快捷操作',
        services: '服务入口',
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
      quickActions: 'Quick actions',
      services: 'Service entry grid',
      nextSteps: 'Next steps',
      resources: 'Resources',
      updates: 'Updates',
      languageLabel: 'Language',
    }
  }, [language])

  const quickActions: CardItem[] = [
    {
      title: language === 'zh' ? '创建工作空间' : 'Create workspace',
      description: language === 'zh' ? '初始化团队并连接入口策略。' : 'Initialize a team and connect entry policies.',
      href: '/account/organizations',
      icon: Command,
    },
    {
      title: language === 'zh' ? '同步身份目录' : 'Sync identity directory',
      description: language === 'zh' ? '绑定 SSO、目录或外部身份源。' : 'Bind SSO, directories, or external identity sources.',
      href: '/account/connections',
      icon: Shield,
    },
    {
      title: language === 'zh' ? '查看事件流' : 'Inspect event stream',
      description: language === 'zh' ? '审计登录、部署与运行时信号。' : 'Audit sign-ins, deployments, and runtime signals.',
      href: '/insight',
      icon: Terminal,
    },
  ]

  const serviceEntries: CardItem[] = [
    {
      title: 'XCloudFlow',
      description: language === 'zh' ? '云原生交付与发布管道。' : 'Cloud-native delivery and rollout pipelines.',
      href: '/panel',
      icon: LayoutTemplate,
    },
    {
      title: 'XStream',
      description: language === 'zh' ? '事件流、指标与追踪聚合。' : 'Event streams, metrics, and trace aggregation.',
      href: '/insight',
      icon: Network,
    },
    {
      title: 'XScopeHub',
      description: language === 'zh' ? '资产拓扑与依赖映射。' : 'Asset topology and dependency mapping.',
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
      tag: language === 'zh' ? '安全' : 'Security',
      title: language === 'zh' ? '建立审计基线' : 'Establish audit baseline',
      description: language === 'zh' ? '配置留存、通知与密钥轮换。' : 'Configure retention, notifications, and key rotation.',
      href: '/insight/audit',
      icon: ClipboardList,
    },
    {
      tag: language === 'zh' ? '连接' : 'Connectivity',
      title: language === 'zh' ? '接入集群' : 'Attach clusters',
      description: language === 'zh' ? '注册运行环境并验证探针。' : 'Register runtimes and validate probes.',
      href: '/cloud_iac',
      icon: Server,
    },
    {
      tag: language === 'zh' ? '发布' : 'Delivery',
      title: language === 'zh' ? '设置批次管控' : 'Set rollout controls',
      description: language === 'zh' ? '定义阶段门与回滚策略。' : 'Define stage gates and rollback policies.',
      href: '/panel/settings',
      icon: Boxes,
    },
    {
      tag: language === 'zh' ? '可观测' : 'Observability',
      title: language === 'zh' ? '同步信号源' : 'Sync signal sources',
      description: language === 'zh' ? '对齐日志、指标与追踪标签。' : 'Align logs, metrics, and trace labels.',
      href: '/insight',
      icon: ListChecks,
    },
  ]

  const resources: CardItem[] = [
    {
      title: language === 'zh' ? 'CLI 工具' : 'CLI tools',
      description: language === 'zh' ? '通过命令行快速管理资源。' : 'Manage resources quickly via CLI.',
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
      title: language === 'zh' ? '示例与模板' : 'Examples & templates',
      description: language === 'zh' ? '复制开箱即用的配置片段。' : 'Copy ready-to-use configuration snippets.',
      href: '/docs/examples',
      icon: Wand2,
    },
    {
      title: language === 'zh' ? 'API Explorer' : 'API explorer',
      description: language === 'zh' ? '交互式测试 REST 与 SDK。' : 'Interactively test REST and SDK calls.',
      href: '/docs/api',
      icon: Api,
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
        <section className="space-y-1">
          <h1 className="text-xl font-semibold">{copy.consoleTitle}</h1>
          <p className="text-sm text-slate-500">{copy.consoleSubtitle}</p>
        </section>

        <QuickActionsSection title={copy.quickActions} items={quickActions} />

        <ServiceEntrySection title={copy.services} items={serviceEntries} />

        <NextStepsSection title={copy.nextSteps} items={checklist} />

        <UnifiedResourcesUpdates
          resourcesTitle={copy.resources}
          updatesTitle={copy.updates}
          resources={resources}
          updates={updates}
        />
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

type ChecklistItem = CardItem & { tag: string }

type UpdateItem = CardItem & { tag: string; date: string }

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
              <a
                key={tab}
                href="#"
                className="rounded px-1 py-1 transition hover:text-slate-900 hover:underline"
              >
                {tab}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded border border-black/[0.08] px-2 py-1 text-slate-600">
            <Search className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[12px]">{searchLabel}</span>
            <kbd className="rounded border border-black/[0.12] bg-slate-100 px-1 text-[11px] text-slate-700">/
            </kbd>
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

function QuickActionsSection({ title, items }: { title: string; items: CardItem[] }) {
  return (
    <section className="space-y-3">
      <SectionTitle label={title} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <ActionCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function ServiceEntrySection({ title, items }: { title: string; items: CardItem[] }) {
  return (
    <section className="space-y-3">
      <SectionTitle label={title} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ActionCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function NextStepsSection({ title, items }: { title: string; items: ChecklistItem[] }) {
  return (
    <section className="space-y-3">
      <SectionTitle label={title} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ChecklistCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function UnifiedResourcesUpdates({
  resourcesTitle,
  updatesTitle,
  resources,
  updates,
}: {
  resourcesTitle: string
  updatesTitle: string
  resources: CardItem[]
  updates: UpdateItem[]
}) {
  return (
    <section className="rounded-lg border border-black/[0.06] bg-white p-6 sm:p-8 space-y-8">
      <div className="space-y-3">
        <SectionTitle label={resourcesTitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((item) => (
            <ActionCard key={item.title} {...item} />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <SectionTitle label={updatesTitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {updates.map((item) => (
            <UpdateCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
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
        <SquareArrowOutUpRight className="ml-auto h-4 w-4 text-slate-400" aria-hidden />
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
      <div className="mx-auto max-w-[1100px] px-4 py-6 space-y-4">
        <div className="grid grid-cols-3 items-center">
          <div />
          <div className="flex justify-center gap-3">
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
          </div>
          <div className="flex justify-end">
            <button className="inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/40">
              <Globe className="h-4 w-4" aria-hidden />
              <span>Theme</span>
              <ChevronDown className="h-3 w-3" aria-hidden />
            </button>
          </div>
        </div>
        <div className="text-center text-xs text-slate-400">© 2025 Cloud-Neutral</div>
      </div>
    </footer>
  )
}
