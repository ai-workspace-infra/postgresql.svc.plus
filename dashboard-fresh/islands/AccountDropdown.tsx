/**
 * Account Dropdown Island - Fresh + Preact
 *
 * Client-side interactive account menu
 */

import { useSignal, useSignalEffect } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'

interface User {
  username?: string
  email?: string
}

interface AccountDropdownProps {
  user: User | null
  language: 'zh' | 'en'
}

export default function AccountDropdown({ user, language }: AccountDropdownProps) {
  const isOpen = useSignal(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    isOpen.value = !isOpen.value
  }

  const closeDropdown = () => {
    isOpen.value = false
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    if (isOpen.value) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen.value])

  if (!user) {
    return null
  }

  const accountInitial = user.username?.charAt(0)?.toUpperCase() ??
                         user.email?.charAt(0)?.toUpperCase() ??
                         '?'

  const menuItems = language === 'zh' ? [
    { label: '个人资料', href: '/panel/profile' },
    { label: '账户设置', href: '/panel/settings' },
    { label: '邮箱管理', href: '/panel/mail' },
    { label: '退出登录', href: '/api/auth/logout', method: 'DELETE' },
  ] : [
    { label: 'Profile', href: '/panel/profile' },
    { label: 'Settings', href: '/panel/settings' },
    { label: 'Mail', href: '/panel/mail' },
    { label: 'Logout', href: '/api/auth/logout', method: 'DELETE' },
  ]

  const handleLogout = async (e: Event) => {
    e.preventDefault()
    try {
      await fetch('/api/auth/session', { method: 'DELETE' })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div class="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={toggleDropdown}
        class="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        aria-expanded={isOpen.value}
        aria-haspopup="true"
      >
        {accountInitial}
      </button>

      {/* Dropdown Menu */}
      {isOpen.value && (
        <div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div class="py-1" role="menu" aria-orientation="vertical">
            {/* User Info */}
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900 truncate">
                {user.username || user.email}
              </p>
              {user.username && user.email && (
                <p class="text-xs text-gray-500 truncate">{user.email}</p>
              )}
            </div>

            {/* Menu Items */}
            {menuItems.map((item) => (
              item.method === 'DELETE' ? (
                <button
                  key={item.href}
                  onClick={handleLogout}
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={closeDropdown}
                >
                  {item.label}
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
