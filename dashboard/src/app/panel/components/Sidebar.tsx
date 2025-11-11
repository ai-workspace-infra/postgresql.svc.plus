'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, type ComponentType } from 'react'

import { getExtensionRegistry } from '@extensions/loader'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import { resolveAccess } from '@lib/accessControl'
import { useUser } from '@lib/userStore'

const registry = getExtensionRegistry()
const PlaceholderIcon: ComponentType<{ className?: string }> = () => null

export interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

interface NavItem {
  href: string
  label: string
  description: string
  Icon: ComponentType<{ className?: string }>
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

export default function Sidebar({ className = '', onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { language } = useLanguage()
  const copy = translations[language].userCenter.mfa
  const { user } = useUser()
  const requiresSetup = Boolean(user && (!user.mfaEnabled || user.mfaPending))

  const navSections = useMemo<NavSection[]>(() => {
    return registry.sidebar
      .map((section) => {
        const items = section.items
          .map((item) => {
            const { route } = item
            const guardResult = route.guard ? resolveAccess(user, route.guard) : { allowed: true }
            const requiresRole = Boolean(route.guard?.roles?.length)
            if (requiresRole && !guardResult.allowed) {
              return null
            }

            const disabledByGuard = !requiresRole && !guardResult.allowed
            const disabled =
              item.disabled ||
              disabledByGuard ||
              (requiresSetup && route.path !== '/panel/account')

            const Icon = route.icon ?? PlaceholderIcon

            return {
              href: route.path,
              label: route.label,
              description: route.description ?? '',
              Icon,
              disabled,
            }
          })
          .filter((value): value is NavItem => Boolean(value))

        if (items.length === 0) {
          return null
        }

        return {
          title: section.title,
          items,
        }
      })
      .filter((value): value is NavSection => Boolean(value))
  }, [requiresSetup, user])

  return (
    <aside
      className={`flex h-full w-64 flex-col gap-6 border-r border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] p-6 text-[var(--color-text)] shadow-[var(--shadow-md)] backdrop-blur transition-colors ${className}`}
    >
      <div className="space-y-1 text-[var(--color-text)] transition-colors">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">XControl</p>
        <h2 className="text-lg font-bold text-[var(--color-heading)]">User Center</h2>
        <p className="text-sm text-[var(--color-text-subtle)]">在同一处掌控权限与功能特性。</p>
      </div>

      {requiresSetup ? (
        <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-warning-muted)] bg-[var(--color-warning-muted)] p-3 text-xs text-[var(--color-warning-foreground)] transition-colors">
          <p className="font-semibold">{copy.pendingHint}</p>
          <p className="mt-1">{copy.lockedMessage}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/panel/account?setupMfa=1"
              onClick={onNavigate}
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              {copy.actions.setup}
            </Link>
            <a
              href={copy.actions.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-primary-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:border-[color:var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
            >
              {copy.actions.docs}
            </a>
          </div>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {navSections.map((section) => {
          const sectionDisabled = section.items.every((item) => item.disabled)

          return (
            <div key={section.title} className="space-y-3">
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  sectionDisabled
                    ? 'text-[var(--color-text-subtle)] opacity-60'
                    : 'text-[var(--color-text-subtle)]'
                }`}
              >
                {section.title}
              </p>
              <div className={`space-y-2 ${sectionDisabled ? 'opacity-60' : ''}`}>
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href)
                  const { Icon } = item

                  const baseClasses = [
                    'group flex items-center gap-3 rounded-[var(--radius-xl)] border px-3 py-3 text-sm transition-colors',
                  ]
                  if (item.disabled) {
                    baseClasses.push(
                      'cursor-not-allowed border-dashed border-[color:var(--color-surface-border)] text-[var(--color-text-subtle)] opacity-60',
                    )
                  } else {
                    baseClasses.push(
                      'border-transparent text-[var(--color-text-subtle)] hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]',
                    )
                  }
                  if (active) {
                    baseClasses.push(
                      'border-[color:var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]',
                    )
                  }

                  const iconClasses = ['flex h-8 w-8 items-center justify-center rounded-xl transition-colors']
                  if (active) {
                    iconClasses.push('bg-[var(--color-primary)] text-[var(--color-primary-foreground)]')
                  } else if (item.disabled) {
                    iconClasses.push('bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)] opacity-60')
                  } else {
                    iconClasses.push(
                      'bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)] group-hover:bg-[var(--color-primary-muted)] group-hover:text-[var(--color-primary)]',
                    )
                  }

                  const descriptionClasses = [
                    'text-xs transition-colors',
                    item.disabled
                      ? 'text-[var(--color-text-subtle)] opacity-60'
                      : 'text-[var(--color-text-subtle)] group-hover:text-[var(--color-primary)]',
                  ]

                  const content = (
                    <div className={baseClasses.join(' ')}>
                      <span className={iconClasses.join(' ')}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex flex-col">
                        <span className="font-semibold">{item.label}</span>
                        <span className={descriptionClasses.join(' ')}>{item.description}</span>
                      </span>
                    </div>
                  )

                  if (item.disabled) {
                    return (
                      <div key={item.href} aria-disabled={true} className="select-none">
                        {content}
                      </div>
                    )
                  }

                  return (
                    <Link key={item.href} href={item.href} onClick={onNavigate}>
                      {content}
                    </Link>
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
