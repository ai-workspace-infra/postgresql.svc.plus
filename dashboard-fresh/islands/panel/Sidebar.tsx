/**
 * Sidebar Island - Fresh + Preact
 *
 * Navigation sidebar for the user panel
 */

import { useSignal, useComputed } from '@preact/signals'
import { Home, User, Settings, Mail, Key, Palette, Shield, Users } from 'lucide-preact'
import type { ComponentType } from 'preact'
import type { User as SessionUser } from '@/lib/userSession.ts'

interface SidebarProps {
  className?: string
  onNavigate?: () => void
  user: SessionUser | null
  currentPath: string
}

interface NavItem {
  href: string
  label: string
  description: string
  // deno-lint-ignore no-explicit-any
  Icon: any
  disabled: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

function isActive(pathname: string, href: string) {
  if (href === '/panel') {
    return pathname === '/panel'
  }
  return pathname.startsWith(href)
}

export default function Sidebar({ className = '', onNavigate, user, currentPath }: SidebarProps) {
  const requiresSetup = useComputed(() => Boolean(user && (!user.mfaEnabled || user.mfaPending)))

  // Define static navigation structure
  const navSections: NavSection[] = [
    {
      title: '个人设置',
      items: [
        {
          href: '/panel',
          label: 'Dashboard',
          description: '总览与快捷入口',
          Icon: Home,
          disabled: false,
        },
        {
          href: '/panel/account',
          label: 'Account',
          description: '账户与安全设置',
          Icon: User,
          disabled: false,
        },
        {
          href: '/panel/appearance',
          label: 'Appearance',
          description: '主题与外观',
          Icon: Palette,
          disabled: requiresSetup.value,
        },
      ],
    },
    {
      title: '功能服务',
      items: [
        {
          href: '/panel/api',
          label: 'API Keys',
          description: 'API 密钥管理',
          Icon: Key,
          disabled: requiresSetup.value,
        },
        {
          href: '/panel/mail',
          label: 'Mail Service',
          description: '邮件服务配置',
          Icon: Mail,
          disabled: requiresSetup.value,
        },
        {
          href: '/panel/agent',
          label: 'Agent',
          description: 'Agent 配置',
          Icon: Shield,
          disabled: requiresSetup.value,
        },
      ],
    },
    {
      title: '管理',
      items: [
        {
          href: '/panel/management',
          label: 'Management',
          description: '资源管理',
          Icon: Settings,
          disabled: requiresSetup.value || !user?.isAdmin,
        },
        {
          href: '/panel/subscription',
          label: 'Subscription',
          description: '订阅管理',
          Icon: Users,
          disabled: requiresSetup.value,
        },
      ],
    },
  ]

  const mfaMessages = {
    pendingHint: '待设置 MFA',
    lockedMessage: '请先完成双因素认证设置后访问其他功能',
    setupAction: '立即设置',
    docsAction: '查看文档',
    docsUrl: '/docs/security/mfa',
  }

  return (
    <aside
      class={`flex h-full w-64 flex-col gap-6 border-r border-slate-200 bg-white/90 p-6 text-slate-900 shadow-md backdrop-blur transition-colors ${className}`}
    >
      <div class="space-y-1 text-slate-900">
        <p class="text-xs font-semibold uppercase tracking-wide text-sky-600">XControl</p>
        <h2 class="text-lg font-bold text-slate-900">User Center</h2>
        <p class="text-sm text-slate-600">在同一处掌控权限与功能特性。</p>
      </div>

      {requiresSetup.value && (
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p class="font-semibold">{mfaMessages.pendingHint}</p>
          <p class="mt-1">{mfaMessages.lockedMessage}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <a
              href="/panel/account?setupMfa=1"
              onClick={onNavigate}
              class="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
            >
              {mfaMessages.setupAction}
            </a>
            <a
              href={mfaMessages.docsUrl}
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center justify-center rounded-md border border-sky-300 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:border-sky-500 hover:bg-sky-50"
            >
              {mfaMessages.docsAction}
            </a>
          </div>
        </div>
      )}

      <nav class="flex flex-1 flex-col gap-6 overflow-y-auto">
        {navSections.map((section) => {
          const sectionDisabled = section.items.every((item) => item.disabled)

          return (
            <div key={section.title} class="space-y-3">
              <p
                class={`text-xs font-semibold uppercase tracking-wide ${
                  sectionDisabled
                    ? 'text-slate-400 opacity-60'
                    : 'text-slate-600'
                }`}
              >
                {section.title}
              </p>
              <div class={`space-y-2 ${sectionDisabled ? 'opacity-60' : ''}`}>
                {section.items.map((item) => {
                  const active = isActive(currentPath, item.href)
                  const { Icon } = item

                  const baseClasses = [
                    'group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-colors',
                  ]
                  if (item.disabled) {
                    baseClasses.push(
                      'cursor-not-allowed border-dashed border-slate-200 text-slate-400 opacity-60',
                    )
                  } else {
                    baseClasses.push(
                      'border-transparent text-slate-600 hover:border-sky-200 hover:bg-slate-50 hover:text-sky-600',
                    )
                  }
                  if (active) {
                    baseClasses.push(
                      'border-sky-500 bg-sky-50 text-sky-700 shadow-sm',
                    )
                  }

                  const iconClasses = ['flex h-8 w-8 items-center justify-center rounded-xl transition-colors']
                  if (active) {
                    iconClasses.push('bg-sky-600 text-white')
                  } else if (item.disabled) {
                    iconClasses.push('bg-slate-100 text-slate-400 opacity-60')
                  } else {
                    iconClasses.push(
                      'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-600',
                    )
                  }

                  const descriptionClasses = [
                    'text-xs transition-colors',
                    item.disabled
                      ? 'text-slate-400 opacity-60'
                      : 'text-slate-500 group-hover:text-sky-600',
                  ]

                  const content = (
                    <div class={baseClasses.join(' ')}>
                      <span class={iconClasses.join(' ')}>
                        <Icon class="h-4 w-4" />
                      </span>
                      <span class="flex flex-col">
                        <span class="font-semibold">{item.label}</span>
                        <span class={descriptionClasses.join(' ')}>{item.description}</span>
                      </span>
                    </div>
                  )

                  if (item.disabled) {
                    return (
                      <div key={item.href} aria-disabled={true} class="select-none">
                        {content}
                      </div>
                    )
                  }

                  return (
                    <a key={item.href} href={item.href} onClick={onNavigate}>
                      {content}
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
