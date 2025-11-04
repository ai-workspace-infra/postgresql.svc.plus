/**
 * Navbar Island - Fresh + Preact
 *
 * Main navigation bar with client-side interactivity
 * Migrated from Next.js to Fresh, preserving original design
 */

import { useSignal, useComputed, useSignalEffect } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'

interface NavItem {
  key: string
  label: string
  href: string
}

interface User {
  username?: string
  email?: string
  isAdmin?: boolean
  isOperator?: boolean
}

interface NavbarProps {
  language: 'zh' | 'en'
  user?: User | null
  pathname?: string
}

export default function Navbar({ language, user, pathname = '/' }: NavbarProps) {
  const menuOpen = useSignal(false)
  const mobileServicesOpen = useSignal(false)
  const accountMenuOpen = useSignal(false)
  const searchValue = useSignal('')
  const navRef = useRef<HTMLElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  const isHiddenRoute = pathname ? ['/login', '/register'].some((prefix) => pathname.startsWith(prefix)) : false

  const isChinese = language === 'zh'
  const labels = {
    home: isChinese ? '首页' : 'Home',
    docs: isChinese ? '文档' : 'Docs',
    download: isChinese ? '下载' : 'Download',
    moreServices: isChinese ? '更多服务' : 'More services',
    searchPlaceholder: isChinese ? '请输入关键字搜索内容' : 'Ask anything about your docs',
    login: isChinese ? '登录' : 'Login',
    register: isChinese ? '注册' : 'Register',
    userCenter: isChinese ? '个人中心' : 'User Center',
    logout: isChinese ? '退出登录' : 'Logout',
  }

  const accountInitial = useComputed(() =>
    user?.username?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'
  )

  const mainLinks: NavItem[] = [
    { key: 'home', label: labels.home, href: '/' },
    { key: 'docs', label: labels.docs, href: '/docs' },
    { key: 'download', label: labels.download, href: '/download' },
  ]

  const serviceItems: NavItem[] = [
    { key: 'artifact', label: isChinese ? '制品管理' : 'Artifacts', href: '/download' },
    { key: 'cloudIac', label: isChinese ? '云原生 IaC' : 'Cloud IaC', href: '/cloud_iac' },
    { key: 'insight', label: isChinese ? '可观测性' : 'Observability', href: '/insight' },
  ]

  // Handle click outside for account menu
  useEffect(() => {
    if (!accountMenuOpen.value) return

    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        accountMenuOpen.value = false
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [accountMenuOpen.value])

  // Update CSS variable for navbar offset
  useEffect(() => {
    if (typeof window === 'undefined') return

    const element = navRef.current
    if (!element) return

    const updateOffset = () => {
      const height = element.getBoundingClientRect().height
      document.documentElement.style.setProperty('--app-shell-nav-offset', `${height}px`)
    }

    updateOffset()

    const resizeObserver = new ResizeObserver(() => {
      updateOffset()
    })

    resizeObserver.observe(element)
    window.addEventListener('resize', updateOffset)

    return () => {
      window.removeEventListener('resize', updateOffset)
      resizeObserver.disconnect()
    }
  }, [])

  const handleSearchSubmit = (event: Event) => {
    event.preventDefault()
    const trimmed = searchValue.value.trim()
    if (!trimmed) return
    // TODO: Implement search functionality
    console.log('Search:', trimmed)
    searchValue.value = ''
  }

  if (isHiddenRoute) {
    return null
  }

  return (
    <nav
      ref={navRef}
      class="fixed top-0 z-50 w-full border-b border-brand-border/60 bg-white/85 backdrop-blur"
    >
      <div class="mx-auto flex max-w-7xl flex-col px-6 sm:px-8">
        <div class="flex items-center gap-6 py-4">
          {/* Left Section - Logo and Main Links */}
          <div class="flex flex-1 items-center gap-8">
            <a href="/" class="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <img
                src="/icons/cloudnative_32.png"
                alt="logo"
                width={24}
                height={24}
                class="h-6 w-6"
              />
              CloudNative Suite
            </a>
            <div class="hidden lg:flex items-center gap-6 text-sm font-medium text-brand-heading">
              {mainLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  class="transition hover:text-brand"
                >
                  {link.label}
                </a>
              ))}
              {serviceItems.length > 0 && (
                <div class="group relative">
                  <button class="flex items-center gap-1 transition hover:text-brand">
                    <span>{labels.moreServices}</span>
                    <svg
                      class="h-4 w-4 text-brand-heading/60 transition group-hover:text-brand"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div class="pointer-events-none absolute left-0 top-full hidden min-w-[200px] translate-y-1 rounded-lg border border-brand-border bg-white py-2 text-sm text-brand-heading opacity-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200 group-hover:pointer-events-auto group-hover:block group-hover:translate-y-2 group-hover:opacity-100">
                    {serviceItems.map((child) => (
                      <a
                        key={child.key}
                        href={child.href}
                        class="flex items-center justify-between gap-2 px-4 py-2 transition hover:bg-brand-surface hover:text-brand"
                      >
                        <span>{child.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Search, Auth, Settings */}
          <div class="hidden flex-1 items-center justify-end gap-4 lg:flex">
            <form onSubmit={handleSearchSubmit} class="relative w-full max-w-xs">
              <input
                type="search"
                value={searchValue.value}
                onInput={(e) => (searchValue.value = (e.target as HTMLInputElement).value)}
                placeholder={labels.searchPlaceholder}
                class="w-full rounded-full border border-brand-border bg-brand-surface/60 py-2 pl-4 pr-10 text-sm text-brand-heading transition focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                class="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-light"
                aria-label="Search"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {user ? (
              <div class="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => (accountMenuOpen.value = !accountMenuOpen.value)}
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shadow-[0_4px_12px_rgba(51,102,255,0.3)] transition hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen.value}
                >
                  {accountInitial}
                </button>
                {accountMenuOpen.value && (
                  <div class="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-brand-border bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                    <div class="border-b border-brand-border/60 bg-brand-surface px-4 py-3">
                      <p class="text-sm font-semibold text-brand-heading">{user.username}</p>
                      <p class="text-xs text-brand-heading/70">{user.email}</p>
                    </div>
                    <div class="py-1 text-sm text-brand-heading">
                      <a
                        href="/panel"
                        class="block px-4 py-2 transition hover:bg-brand-surface"
                        onClick={() => (accountMenuOpen.value = false)}
                      >
                        {labels.userCenter}
                      </a>
                      <a
                        href="/logout"
                        class="flex w-full items-center px-4 py-2 text-left text-red-600 hover:bg-red-50"
                        onClick={() => (accountMenuOpen.value = false)}
                      >
                        {labels.logout}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
            )}

            {/* Mail Icon */}
            <a
              href="/panel/mail"
              class="hidden h-9 w-9 items-center justify-center rounded-full border border-brand-border text-brand transition hover:border-brand hover:bg-brand/10 hover:text-brand lg:flex"
              aria-label="Mail center"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>

            {/* Language Toggle */}
            <a
              href={language === 'zh' ? '?lang=en' : '?lang=zh'}
              class="rounded-full border border-brand-border px-3 py-1.5 text-sm text-brand-heading transition hover:border-brand hover:bg-brand-surface"
            >
              {language === 'zh' ? 'English' : '中文'}
            </a>

            {/* Experimental Icon (Release Channel Selector) */}
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border text-brand transition hover:border-brand hover:bg-brand/10"
              aria-label="Release channels"
              title="Release channels"
            >
              🧪
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            class="flex items-center text-gray-900 focus:outline-none lg:hidden"
            onClick={() => (menuOpen.value = !menuOpen.value)}
            aria-label="Toggle menu"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {menuOpen.value ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen.value && (
          <div class="flex flex-col gap-4 border-t border-gray-200 py-4 lg:hidden">
            <form onSubmit={handleSearchSubmit} class="relative">
              <input
                type="search"
                value={searchValue.value}
                onInput={(e) => (searchValue.value = (e.target as HTMLInputElement).value)}
                placeholder={labels.searchPlaceholder}
                class="w-full rounded-full border border-brand-border bg-brand-surface/60 py-2 pl-4 pr-10 text-sm text-brand-heading transition focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-light"
                aria-label="Search"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <div class="flex flex-col gap-2 text-sm font-medium text-gray-700">
              {mainLinks.map((link) => (
                <a key={link.key} href={link.href} class="py-2" onClick={() => (menuOpen.value = false)}>
                  {link.label}
                </a>
              ))}
              {serviceItems.length > 0 && (
                <div>
                  <button
                    class="flex w-full items-center justify-between py-2"
                    onClick={() => (mobileServicesOpen.value = !mobileServicesOpen.value)}
                  >
                    <span>{labels.moreServices}</span>
                    <svg
                      class={`h-4 w-4 transform transition ${mobileServicesOpen.value ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {mobileServicesOpen.value && (
                    <div class="pl-4 text-sm text-gray-600">
                      {serviceItems.map((child) => (
                        <a
                          key={child.key}
                          href={child.href}
                          class="block py-1.5"
                          onClick={() => (menuOpen.value = false)}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <div class="rounded-xl border border-brand-border bg-white p-4 text-brand-heading shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div class="flex items-center gap-3">
                  <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                    {accountInitial}
                  </span>
                  <div>
                    <p class="text-sm font-semibold">{user.username}</p>
                    <p class="text-xs text-brand-heading/60">{user.email}</p>
                  </div>
                </div>
                <a
                  href="/panel"
                  class="mt-3 inline-flex items-center justify-center rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand hover:text-brand-light"
                  onClick={() => (menuOpen.value = false)}
                >
                  {labels.userCenter}
                </a>
                <a
                  href="/logout"
                  class="mt-3 inline-flex items-center justify-center rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand hover:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
                  onClick={() => (menuOpen.value = false)}
                >
                  {labels.logout}
                </a>
              </div>
            ) : (
              <div class="flex items-center gap-3 text-sm font-medium text-gray-700">
                <a href="/login" class="py-2" onClick={() => (menuOpen.value = false)}>
                  {labels.login}
                </a>
                <span class="h-3 w-px bg-gray-300" aria-hidden="true" />
                <a
                  href="/register"
                  class="rounded-full border border-brand-border px-4 py-1.5 text-brand transition hover:border-brand hover:bg-brand-surface"
                  onClick={() => (menuOpen.value = false)}
                >
                  {labels.register}
                </a>
              </div>
            )}

            <div class="flex flex-col gap-2">
              <a
                href={language === 'zh' ? '?lang=en' : '?lang=zh'}
                class="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-heading transition hover:bg-brand-surface"
              >
                {language === 'zh' ? 'Switch to English' : '切换到中文'}
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
