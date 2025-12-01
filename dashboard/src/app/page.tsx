'use client'

export const dynamic = 'error'

import Navbar from '@components/Navbar'
import { useLanguage } from '@i18n/LanguageProvider'
import { BookOpen, ExternalLink, FileText, Globe, Layers, RefreshCw, ServerCog, Shield, Terminal } from 'lucide-react'
import type { ReactNode } from 'react'

const sectionCardClass = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
const itemCardClass =
  'flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'

export default function HomePage() {
  const { language } = useLanguage()

  const quickActions: LinkCard[] = [
    {
      title: language === 'zh' ? '创建空间' : 'Create workspace',
      description: language === 'zh' ? '初始化团队并配置访问入口。' : 'Initialize a team and set entry controls.',
      action: language === 'zh' ? '进入控制台' : 'Open console',
      href: '/account/organizations',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '同步身份目录' : 'Sync identity directory',
      description: language === 'zh' ? '接入 SSO 或目录同步任务。' : 'Connect SSO or directory sync tasks.',
      action: language === 'zh' ? '开始' : 'Start now',
      href: '/account/connections',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '查看事件流' : 'Inspect event stream',
      description: language === 'zh' ? '审计登录与部署事件。' : 'Audit sign-in and deployment events.',
      action: language === 'zh' ? '查看' : 'Inspect',
      href: '/insight',
      icon: <Terminal className="h-4 w-4" />,
    },
  ]

  const serviceEntries: LinkCard[] = [
    {
      title: language === 'zh' ? '账户与权限' : 'Accounts & access',
      description: language === 'zh' ? '身份、组与策略入口。' : 'Identities, groups, and policies.',
      action: language === 'zh' ? '管理' : 'Manage',
      href: '/account',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '云资源编排' : 'Cloud resources',
      description: language === 'zh' ? '管理租户与运行环境。' : 'Manage tenants and runtimes.',
      action: language === 'zh' ? '进入' : 'Open',
      href: '/cloud_iac',
      icon: <ServerCog className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '交付流水线' : 'Delivery pipelines',
      description: language === 'zh' ? '查看部署批次与审批。' : 'Review deployments and approvals.',
      action: language === 'zh' ? '查看' : 'Review',
      href: '/panel',
      icon: <RefreshCw className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '知识与文档' : 'Knowledge & docs',
      description: language === 'zh' ? '访问项目文档与记录。' : 'Access project documents and records.',
      action: language === 'zh' ? '打开' : 'Open',
      href: '/docs',
      icon: <BookOpen className="h-4 w-4" />,
    },
  ]

  const nextSteps: LinkCard[] = [
    {
      title: language === 'zh' ? '配置环境密钥' : 'Configure environment keys',
      description: language === 'zh' ? '确保流水线密钥就绪。' : 'Ensure pipeline secrets are ready.',
      action: language === 'zh' ? '配置' : 'Configure',
      href: '/panel/settings',
      icon: <Terminal className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '同步监控指标' : 'Sync monitoring signals',
      description: language === 'zh' ? '绑定日志与指标源。' : 'Bind logs and metrics sources.',
      action: language === 'zh' ? '绑定' : 'Attach',
      href: '/insight',
      icon: <Globe className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '建立审计基线' : 'Establish audit baseline',
      description: language === 'zh' ? '设置留存与告警阈值。' : 'Set retention and alert thresholds.',
      action: language === 'zh' ? '设置' : 'Set up',
      href: '/insight/audit',
      icon: <Shield className="h-4 w-4" />,
    },
  ]

  const resources: LinkCard[] = [
    {
      title: language === 'zh' ? 'API 参考' : 'API reference',
      description: language === 'zh' ? '使用 REST 与 SDK 调用。' : 'Use REST and SDK entry points.',
      action: language === 'zh' ? '查看' : 'Read',
      href: '/docs/api',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '策略样例库' : 'Policy snippets',
      description: language === 'zh' ? '复制合规策略模板。' : 'Copy reusable compliance snippets.',
      action: language === 'zh' ? '浏览' : 'Browse',
      href: '/docs/policies',
      icon: <Terminal className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '操作手册' : 'Operations handbook',
      description: language === 'zh' ? '标准故障与恢复流程。' : 'Standard incident and recovery playbooks.',
      action: language === 'zh' ? '打开' : 'Open',
      href: '/docs/runbooks',
      icon: <BookOpen className="h-4 w-4" />,
    },
  ]

  const blogUpdates: LinkCard[] = [
    {
      title: language === 'zh' ? '零信任入口更新' : 'Zero-trust entry update',
      description: language === 'zh' ? '新的入口策略审计摘要。' : 'New entry policy audit summaries.',
      action: language === 'zh' ? '查看' : 'View',
      href: '/blog/zero-trust-entry',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '控制平面最佳实践' : 'Control plane patterns',
      description: language === 'zh' ? '如何分层隔离租户与环境。' : 'Layered isolation across tenants and stages.',
      action: language === 'zh' ? '阅读' : 'Read',
      href: '/blog/control-plane-practices',
      icon: <ServerCog className="h-4 w-4" />,
    },
    {
      title: language === 'zh' ? '流水线可观测性' : 'Pipeline observability',
      description: language === 'zh' ? '指标、日志与追踪对齐实践。' : 'Align metrics, logs, and traces.',
      action: language === 'zh' ? '了解' : 'Learn',
      href: '/blog/pipeline-observability',
      icon: <RefreshCw className="h-4 w-4" />,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="py-14">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <QuickActionsSection label={language === 'zh' ? '快捷操作' : 'Quick actions'} items={quickActions} />
          <ServiceEntryGrid
            label={language === 'zh' ? '服务入口' : 'Service entry grid'}
            items={serviceEntries}
          />
          <NextSteps label={language === 'zh' ? '下一步' : 'Next steps'} items={nextSteps} />
          <Resources label={language === 'zh' ? '资源' : 'Resources'} items={resources} />
          <BlogUpdates label={language === 'zh' ? '更新' : 'Blog updates'} items={blogUpdates} />
        </div>
      </main>
      <FooterMinimalIconsOnly />
    </div>
  )
}

type LinkCard = {
  title: string
  description: string
  action: string
  href: string
  icon: ReactNode
}

type SectionProps = {
  label: string
  items: LinkCard[]
}

function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="h-2 w-2 rounded-full bg-slate-900" aria-hidden />
        {label}
      </div>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
  )
}

function QuickActionsSection({ label, items }: SectionProps) {
  return (
    <section className={sectionCardClass}>
      <SectionHeader label={label} hint="Task-first" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <CardLink key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function ServiceEntryGrid({ label, items }: SectionProps) {
  return (
    <section className={sectionCardClass}>
      <SectionHeader label={label} hint="Entry points" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <CardLink key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function NextSteps({ label, items }: SectionProps) {
  return (
    <section className={sectionCardClass}>
      <SectionHeader label={label} hint="Checklist" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <CardLink key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function Resources({ label, items }: SectionProps) {
  return (
    <section className={sectionCardClass}>
      <SectionHeader label={label} hint="Docs" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <CardLink key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function BlogUpdates({ label, items }: SectionProps) {
  return (
    <section className={sectionCardClass}>
      <SectionHeader label={label} hint="Latest" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <CardLink key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function CardLink({ title, description, action, href, icon }: LinkCard) {
  return (
    <a className={itemCardClass} href={href}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
          {icon}
        </span>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-sm text-slate-600">{description}</div>
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
        {action}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </div>
    </a>
  )
}

function FooterMinimalIconsOnly() {
  const items = [
    { label: 'Status', href: 'https://status.xcontrol.io', icon: Globe },
    { label: 'Docs', href: '/docs', icon: BookOpen },
    { label: 'Changelog', href: '/blog', icon: RefreshCw },
  ]

  return (
    <footer className="border-t border-slate-200 bg-slate-900 py-6">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-4">
        {items.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="sr-only">{label}</span>
          </a>
        ))}
      </div>
    </footer>
  )
}
