/**
 * Navbar Island - Fresh + Preact
 *
 * Main navigation bar with client-side interactivity
 * Migrated from Next.js to Fresh, preserving original design
 */

import { useSignal, useComputed, useSignalEffect } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import UserMenu from '@/islands/UserMenu.tsx'
import { user as userSignal } from '@/lib/userStore.tsx'

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
  const searchValue = useSignal('')
  const navRef = useRef<HTMLElement>(null)

  // Use Signals store user if available, otherwise use server-provided user
  const currentUser = useSignal<User | null>(userSignal.value || user || null)

  // Sync with Signals store on mount and when it changes
  useEffect(() => {
    // Use Signals store user
    if (userSignal.value) {
      currentUser.value = userSignal.value
    }
  }, [])

  // Fetch session on client-side to get fresh user info
  useEffect(() => {
    let isActive = true

    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (!isActive || !response.ok) {
          return
        }

        const data = (await response.json()) as {
          user?: User
        }

        if (isActive && data.user) {
          currentUser.value = data.user
        }
      } catch (error) {
        // Silently fail if session fetch fails
        console.debug('Failed to fetch session:', error)
      }
    }

    // Listen for login success event
    const handleLoginSuccess = () => {
      if (isActive) {
        fetchSession()
      }
    }

    // Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchSession()
      window.addEventListener('login-success', handleLoginSuccess)
    }

    return () => {
      isActive = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('login-success', handleLoginSuccess)
      }
    }
  }, [])

  const isHiddenRoute = pathname ? ['/login', '/register'].some((prefix) => pathname.startsWith(prefix)) : false

  // Generate language toggle URL that preserves current path and params
  const getLanguageToggleUrl = () => {
    if (typeof window === 'undefined') {
      // Server-side fallback
      return language === 'zh' ? '?lang=en' : '?lang=zh'
    }
    const newLang = language === 'zh' ? 'en' : 'zh'
    const url = new URL(window.location.href)
    url.searchParams.set('lang', newLang)
    return `${url.pathname}${url.search}`
  }

  const isChinese = language === 'zh'
  const labels = {
    home: isChinese ? '首页' : 'Home',
    docs: isChinese ? '文档' : 'Docs',
    download: isChinese ? '下载' : 'Download',
    moreServices: isChinese ? '更多服务' : 'More services',
    searchPlaceholder: isChinese ? '请输入关键字搜索内容' : 'Ask anything about your docs',
  }

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
    // Note: Avoid logging search terms as they may contain sensitive information
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
              Cloud-Neutral
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

            <UserMenu user={currentUser.value} language={language} />

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
              href={getLanguageToggleUrl()}
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

            <div onClick={() => (menuOpen.value = false)}>
              <UserMenu user={currentUser.value} language={language} />
            </div>

            <div class="flex flex-col gap-2">
              <a
                href={getLanguageToggleUrl()}
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
