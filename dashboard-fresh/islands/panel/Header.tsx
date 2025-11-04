/**
 * Header Island - Fresh + Preact
 *
 * Top header bar for the user panel
 */

import { Menu } from 'lucide-preact'
import type { ComponentType } from 'preact'
import type { User, UserRole } from '@/lib/userSession.ts'

// Type assertion for lucide icons
const MenuIcon = Menu as unknown as ComponentType<{ class?: string }>

const ROLE_BADGES: Record<UserRole, { label: string; className: string }> = {
  guest: {
    label: 'Guest',
    className: 'bg-slate-100 text-slate-600',
  },
  user: {
    label: 'User',
    className: 'bg-blue-100 text-blue-700',
  },
  operator: {
    label: 'Operator',
    className: 'bg-emerald-100 text-emerald-700',
  },
  admin: {
    label: 'Admin',
    className: 'bg-sky-100 text-sky-700',
  },
}

interface HeaderProps {
  onMenu: () => void
  user: User | null
  isLoading?: boolean
}

function resolveAccountInitial(input?: string | null) {
  if (!input) {
    return '?'
  }

  const normalized = input.trim()
  if (!normalized) {
    return '?'
  }

  return normalized.charAt(0).toUpperCase()
}

export default function Header({ onMenu, user, isLoading = false }: HeaderProps) {
  const role: UserRole = user?.role ?? 'guest'
  const badge = ROLE_BADGES[role]
  const accountLabel = user?.name ?? user?.username ?? user?.email ?? 'Guest user'
  const accountInitial = resolveAccountInitial(accountLabel)
  const statusBadge = isLoading ? 'Syncing' : badge.label
  const badgeClasses = isLoading
    ? 'bg-slate-100 text-slate-500 opacity-70'
    : badge.className

  return (
    <header class="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-sm backdrop-blur transition-colors md:px-6">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-600 md:hidden"
        onClick={onMenu}
        aria-label="Toggle navigation menu"
      >
        <MenuIcon class="h-4 w-4" />
        Menu
      </button>

      <div class="flex flex-1 items-center justify-end gap-4 md:justify-between">
        <div class="hidden flex-col text-sm text-slate-600 md:flex">
          <span class="font-semibold text-slate-900">XControl User Center</span>
          <span>Personalized access across every service touchpoint</span>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="/"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-600"
          >
            返回主页
          </a>
          <span class={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>{statusBadge}</span>
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-semibold text-white shadow-sm transition-colors">
            {isLoading ? <span class="animate-pulse">…</span> : accountInitial}
          </div>
          <div class="hidden flex-col text-right text-xs text-slate-600 sm:flex">
            <span class="text-sm font-semibold text-slate-900">{accountLabel}</span>
            <span>{user?.email ?? (isLoading ? 'Checking session…' : 'Not signed in')}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
