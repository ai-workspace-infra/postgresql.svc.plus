'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Mail, Search } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'
import LanguageToggle from './LanguageToggle'
import ReleaseChannelSelector, { ReleaseChannel } from './ReleaseChannelSelector'
import { getFeatureToggleInfo } from '@lib/featureToggles'
import { useUser } from '@lib/userStore'
import { AskAIDialog } from './AskAIDialog'

const CHANNEL_ORDER: ReleaseChannel[] = ['stable', 'beta', 'develop']
const DEFAULT_CHANNELS: ReleaseChannel[] = ['stable']
const RELEASE_CHANNEL_STORAGE_KEY = 'cloudnative-suite.releaseChannels'

type NavSubItem = {
  key: string
  label: string
  href: string
  togglePath?: string
  channels?: ReleaseChannel[]
  enabled?: boolean
}

export default function Navbar() {
  const pathname = usePathname()
  const isHiddenRoute = pathname ? ['/login', '/register'].some((prefix) => pathname.startsWith(prefix)) : false
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<ReleaseChannel[]>(['stable'])
  const navRef = useRef<HTMLElement | null>(null)
  const { language } = useLanguage()
  const { user } = useUser()
  const nav = translations[language].nav
  const channelLabels = nav.releaseChannels
  const accountCopy = nav.account
  const accountInitial =
    user?.username?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem(RELEASE_CHANNEL_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as unknown
      if (!Array.isArray(parsed)) return

      const normalized = CHANNEL_ORDER.filter((channel) => parsed.includes(channel))
      if (normalized.length === 0) return

      const restored: ReleaseChannel[] = normalized.includes('stable')
        ? normalized
        : [...DEFAULT_CHANNELS, ...normalized]
      setSelectedChannels((current) => {
        if (current.length === restored.length && current.every((value, index) => value === restored[index])) {
          return current
        }
        return restored
      })
    } catch (error) {
      console.warn('Failed to restore release channels selection', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(RELEASE_CHANNEL_STORAGE_KEY, JSON.stringify(selectedChannels))
  }, [selectedChannels])

  useEffect(() => {
    if (!accountMenuOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [accountMenuOpen])

  useEffect(() => {
    setAccountMenuOpen(false)
  }, [user])

  const selectedChannelSet = useMemo(() => new Set(selectedChannels), [selectedChannels])

  const accountChildren: NavSubItem[] = user
    ? [
        {
          key: 'userCenter',
          label: accountCopy.userCenter,
          href: '/panel',
          togglePath: '/panel',
        },
        ...(user?.isAdmin || user?.isOperator
          ? [
              {
                key: 'management',
                label: accountCopy.management,
                href: '/panel/management',
                togglePath: '/panel/management',
              } satisfies NavSubItem,
            ]
          : []),
        {
          key: 'logout',
          label: accountCopy.logout,
          href: '/logout',
        },
      ]
    : [
        {
          key: 'register',
          label: nav.account.register,
          href: '/register',
          togglePath: '/register',
        },
        {
          key: 'login',
          label: nav.account.login,
          href: '/login',
          togglePath: '/login',
        },
        {
          key: 'demo',
          label: nav.account.demo,
          href: '/demo',
          togglePath: '/demo',
        },
      ]

  const accountLabel = nav.account.title

  const serviceItems: NavSubItem[] = useMemo(() => {
    const rawItems: NavSubItem[] = [
      {
        key: 'artifact',
        label: nav.services.artifact,
        href: '/download',
        togglePath: '/download',
      },
      {
        key: 'cloudIac',
        label: nav.services.cloudIac,
        href: '/cloud_iac',
        togglePath: '/cloud_iac',
      },
      {
        key: 'insight',
        label: nav.services.insight,
        href: '/insight',
        togglePath: '/insight',
      },
      {
        key: 'docs',
        label: nav.services.docs,
        href: '/docs',
        togglePath: '/docs',
      },
    ]

    return rawItems
      .map((child) => {
        if (!child.togglePath) {
          return { ...child, enabled: true }
        }

        const { enabled, channel } = getFeatureToggleInfo('globalNavigation', child.togglePath)
        const derivedChannels = child.channels ?? (channel ? [channel] : undefined)

        return {
          ...child,
          enabled,
          channels: derivedChannels,
        }
      })
      .filter((child) => {
        if (child.enabled === false) {
          return false
        }

        const childChannels: ReleaseChannel[] = child.channels?.length
          ? child.channels
          : DEFAULT_CHANNELS
        return childChannels.some((channel) => selectedChannelSet.has(channel))
      })
      .map(({ enabled: _enabled, ...child }) => child)
  }, [nav.services.artifact, nav.services.cloudIac, nav.services.docs, nav.services.insight, selectedChannelSet])

  const toggleChannel = (channel: ReleaseChannel) => {
    if (channel === 'stable') return
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((value) => value !== channel) : [...prev, channel],
    )
  }

  const getPreviewBadge = (channels?: ReleaseChannel[]) => {
    if (!channels || channels.length === 0) {
      return null
    }

    const previewChannel = channels.find((channel) => channel !== 'stable')
    if (!previewChannel) {
      return null
    }

    return (
      <span className="rounded-full bg-[var(--color-badge-muted)] px-2 py-0.5 text-xs font-medium uppercase text-[var(--color-primary)] transition-colors">
        {channelLabels.badges[previewChannel]}
      </span>
    )
  }

  const isChinese = language === 'zh'
  const labels = {
    home: isChinese ? '首页' : 'Home',
    docs: isChinese ? '文档' : 'Docs',
    download: isChinese ? '下载' : 'Download',
    moreServices: isChinese ? '更多服务' : 'More services',
    searchPlaceholder: isChinese ? '请输入关键字搜索内容' : 'Ask anything about your docs',
  }

  const [searchValue, setSearchValue] = useState('')
  const [askDialogOpen, setAskDialogOpen] = useState(false)
  const [pendingQuestion, setPendingQuestion] = useState<{ key: number; text: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const element = navRef.current
    if (!element) {
      return
    }

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

  const mainLinks = [
    { key: 'home', label: labels.home, href: '/' },
    { key: 'docs', label: labels.docs, href: '/docs' },
    { key: 'download', label: labels.download, href: '/download' },
  ]

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = searchValue.trim()
    if (!trimmed) return
    setPendingQuestion({ key: Date.now(), text: trimmed })
    setAskDialogOpen(true)
    setSearchValue('')
  }

  if (isHiddenRoute) {
    return null
  }

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 z-50 w-full border-b border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur transition-colors"
      >
        <div className="mx-auto flex max-w-7xl flex-col px-6 transition-colors sm:px-8">
          <div className="flex items-center gap-6 py-4">
            <div className="flex flex-1 items-center gap-8">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-semibold text-[var(--color-heading)] transition-colors"
              >
                <Image
                  src="/icons/cloudnative_32.png"
                  alt="logo"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                  unoptimized
                />
                Cloud-Neutral
              </Link>
              <div className="hidden items-center gap-6 text-sm font-medium text-[var(--color-heading)] transition-colors lg:flex">
                {mainLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="transition-colors hover:text-[var(--color-primary)]"
                  >
                    {link.label}
                  </Link>
                ))}
                {serviceItems.length > 0 ? (
                  <div className="group relative">
                    <button className="flex items-center gap-1 transition-colors hover:text-[var(--color-primary)]">
                      <span>{labels.moreServices}</span>
                      <svg
                        className="h-4 w-4 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary)]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="pointer-events-none absolute left-0 top-full hidden min-w-[200px] translate-y-1 rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] py-2 text-sm text-[var(--color-text)] opacity-0 shadow-[var(--shadow-md)] transition-all duration-200 group-hover:pointer-events-auto group-hover:block group-hover:translate-y-2 group-hover:opacity-100">
                      {serviceItems.map((child) => {
                        const isExternal = child.href.startsWith('http')
                        if (isExternal) {
                          return (
                            <a
                              key={child.key}
                              href={child.href}
                              className="flex items-center justify-between gap-2 px-4 py-2 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>{child.label}</span>
                              {getPreviewBadge(child.channels)}
                            </a>
                          )
                        }

                        return (
                          <Link
                            key={child.key}
                            href={child.href}
                            className="flex items-center justify-between gap-2 px-4 py-2 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]"
                          >
                            <span>{child.label}</span>
                            {getPreviewBadge(child.channels)}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="hidden flex-1 items-center justify-end gap-4 lg:flex">
              <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={labels.searchPlaceholder}
                  className="w-full rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] py-2 pl-4 pr-10 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-subtle)] focus:border-[color:var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-hover)]"
                  aria-label="Ask AI"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-2"
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                  >
                    {accountInitial}
                  </button>
                  {accountMenuOpen ? (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] transition-colors">
                      <div className="border-b border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-4 py-3 transition-colors">
                        <p className="text-sm font-semibold text-[var(--color-heading)]">{user.username}</p>
                        <p className="text-xs text-[var(--color-text-subtle)]">{user.email}</p>
                      </div>
                      <div className="py-1 text-sm text-[var(--color-text)] transition-colors">
                        <Link
                          href="/panel"
                          className="block px-4 py-2 transition-colors hover:bg-[var(--color-surface-hover)]"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          {accountCopy.userCenter}
                        </Link>
                        <Link
                          href="/logout"
                          className="flex w-full items-center px-4 py-2 text-left text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-muted)]"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          {accountCopy.logout}
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text)] transition-colors">
                  <Link href="/login" className="transition-colors hover:text-[var(--color-primary)]">
                    {nav.account.login}
                  </Link>
                  <span className="h-3 w-px bg-[var(--color-divider)]" aria-hidden="true" />
                  <Link
                    href="/register"
                    className="rounded-full border border-[color:var(--color-primary)] px-4 py-1.5 text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-muted)]"
                  >
                    {nav.account.register}
                  </Link>
                </div>
              )}
              <Link
                href="/panel/mail"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-surface-border)] text-[var(--color-primary)] transition-colors hover:border-[color:var(--color-primary)] hover:bg-[var(--color-primary-muted)] lg:flex"
                aria-label="Mail center"
              >
                <Mail className="h-4 w-4" />
              </Link>
              <LanguageToggle />
              <ReleaseChannelSelector
                selected={selectedChannels}
                onToggle={toggleChannel}
                variant="icon"
              />
            </div>

            <button
              className="flex items-center text-[var(--color-text)] transition-colors focus:outline-none lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {menuOpen ? (
            <div className="flex flex-col gap-4 border-t border-[color:var(--color-surface-border)] py-4 transition-colors lg:hidden">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={labels.searchPlaceholder}
                  className="w-full rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] py-2 pl-4 pr-10 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-subtle)] focus:border-[color:var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-hover)]"
                  aria-label="Ask AI"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
              <div className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)] transition-colors">
                {mainLinks.map((link) => (
                  <Link key={link.key} href={link.href} className="py-2" onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </Link>
                ))}
                {serviceItems.length > 0 ? (
                  <div>
                    <button
                      className="flex w-full items-center justify-between py-2 transition-colors"
                      onClick={() => setMobileServicesOpen((prev) => !prev)}
                    >
                      <span>{labels.moreServices}</span>
                      <svg
                        className={`h-4 w-4 transform text-[var(--color-text-muted)] transition ${mobileServicesOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {mobileServicesOpen ? (
                      <div className="pl-4 text-sm text-[var(--color-text-muted)] transition-colors">
                        {serviceItems.map((child) => {
                          const isExternal = child.href.startsWith('http')
                          if (isExternal) {
                            return (
                              <a
                                key={child.key}
                                href={child.href}
                                className="block py-1.5 transition-colors hover:text-[var(--color-primary)]"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMenuOpen(false)}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{child.label}</span>
                                  {getPreviewBadge(child.channels)}
                                </span>
                              </a>
                            )
                          }

                          return (
                            <Link
                              key={child.key}
                              href={child.href}
                              className="block py-1.5 transition-colors hover:text-[var(--color-primary)]"
                              onClick={() => setMenuOpen(false)}
                            >
                              <span className="flex items-center gap-2">
                                <span>{child.label}</span>
                                {getPreviewBadge(child.channels)}
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {user ? (
                <div className="rounded-xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text)] shadow-[var(--shadow-md)] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors">
                      {accountInitial}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-heading)] transition-colors">{user.username}</p>
                      <p className="text-xs text-[var(--color-text-subtle)] transition-colors">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/panel"
                    className="mt-3 inline-flex items-center justify-center rounded-lg border border-[color:var(--color-primary)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-muted)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {accountCopy.userCenter}
                  </Link>
                  <Link
                    href="/logout"
                    className="mt-3 inline-flex items-center justify-center rounded-lg border border-[color:var(--color-danger)] px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    {accountCopy.logout}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text)] transition-colors">
                  <Link href="/login" className="py-2" onClick={() => setMenuOpen(false)}>
                    {nav.account.login}
                  </Link>
                  <span className="h-3 w-px bg-[var(--color-divider)]" aria-hidden="true" />
                  <Link
                    href="/register"
                    className="rounded-full border border-[color:var(--color-primary)] px-4 py-1.5 text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-muted)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {nav.account.register}
                  </Link>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <ReleaseChannelSelector selected={selectedChannels} onToggle={toggleChannel} />
                <LanguageToggle />
              </div>
            </div>
          ) : null}
        </div>
      </nav>

      <AskAIDialog
        open={askDialogOpen}
        onMinimize={() => setAskDialogOpen(false)}
        onEnd={() => {
          setAskDialogOpen(false)
          setPendingQuestion(null)
        }}
        initialQuestion={pendingQuestion ?? undefined}
      />
    </>
  )
}

