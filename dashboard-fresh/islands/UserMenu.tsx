/**
 * UserMenu Island - Fresh + Preact
 *
 * Standalone user menu component with dropdown
 * - Avatar with first letter of username/email
 * - User info card (avatar, name, email)
 * - User center and logout buttons
 * - Click outside to close
 * - Consistent styling with Navbar
 */

import { useSignal, useComputed } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'

interface User {
  username?: string
  email?: string
  isAdmin?: boolean
  isOperator?: boolean
}

interface UserMenuProps {
  user: User | null
  language: 'zh' | 'en'
}

export default function UserMenu({ user, language }: UserMenuProps) {
  const isOpen = useSignal(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Compute avatar initial (first letter of username or email)
  const avatarInitial = useComputed(() =>
    user?.username?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'
  )

  // Localized labels
  const labels = {
    userCenter: language === 'zh' ? '个人中心' : 'User Center',
    logout: language === 'zh' ? '退出登录' : 'Logout',
    login: language === 'zh' ? '登录' : 'Login',
    register: language === 'zh' ? '注册' : 'Register',
  }

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen.value) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        isOpen.value = false
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen.value])

  // If user is not logged in, show login/register buttons
  if (!user) {
    return (
      <div class="flex items-center gap-3 text-sm font-medium text-brand-heading">
        <a href="/login" class="transition hover:text-brand">
          {labels.login}
        </a>
        <span class="h-3 w-px bg-gray-300" aria-hidden="true" />
        <a
          href="/register"
          class="rounded-full border border-brand-border px-4 py-1.5 text-brand transition hover:border-brand hover:bg-brand-surface"
        >
          {labels.register}
        </a>
      </div>
    )
  }

  // User is logged in, show avatar button and dropdown
  return (
    <div class="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => (isOpen.value = !isOpen.value)}
        class="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shadow-[0_4px_12px_rgba(51,102,255,0.3)] transition hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
        aria-haspopup="menu"
        aria-expanded={isOpen.value}
        aria-label={language === 'zh' ? '用户菜单' : 'User menu'}
      >
        {avatarInitial}
      </button>

      {/* Dropdown Card */}
      {isOpen.value && (
        <div class="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-brand-border bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          {/* User Info Section */}
          <div class="border-b border-brand-border/60 bg-brand-surface px-4 py-3">
            <div class="flex items-center gap-3">
              {/* Avatar in dropdown */}
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                {avatarInitial}
              </div>
              <div class="flex-1 overflow-hidden">
                {user.username && (
                  <p class="truncate text-sm font-semibold text-brand-heading">{user.username}</p>
                )}
                {user.email && (
                  <p class="truncate text-xs text-brand-heading/70">{user.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Actions */}
          <div class="py-1 text-sm text-brand-heading">
            {/* User Center Link */}
            <a
              href="/panel"
              class="block px-4 py-2 transition hover:bg-brand-surface"
              onClick={() => (isOpen.value = false)}
            >
              {labels.userCenter}
            </a>

            {/* Logout Link */}
            <a
              href="/logout"
              class="flex w-full items-center px-4 py-2 text-left text-red-600 transition hover:bg-red-50"
              onClick={() => (isOpen.value = false)}
            >
              {labels.logout}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
