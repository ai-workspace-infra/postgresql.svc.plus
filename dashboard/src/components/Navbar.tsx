'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'
import LanguageToggle from './LanguageToggle'
import ReleaseChannelSelector, { ReleaseChannel } from './ReleaseChannelSelector'
import { getFeatureToggleInfo } from '@lib/featureToggles'
import { useUser } from '@lib/userStore'
import SearchComponent from './search'

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
  const isHiddenRoute = pathname
    ? ['/login', '/register', '/xstream', '/xcloudflow', '/xscopehub', '/blog'].some((prefix) =>
        pathname.startsWith(prefix),
      )
    : false
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
      <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-medium uppercase text-brand">
        {channelLabels.badges[previewChannel]}
      </span>
    )
  }

  const isChinese = language === 'zh'
  const labels = {
    home: isChinese ? '首页' : 'Home',
    docs: isChinese ? '文档' : 'Docs',
    download: isChinese ? '下载' : 'Download',
    openSource: isChinese ? '开源项目' : 'Open source',
    moreServices: isChinese ? '更多服务' : 'More services',
  }

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
  ]

  const downloadLink = { key: 'download', label: labels.download, href: '/download' }

  const openSourceProjects = [
    { key: 'xstream', label: 'XStream', href: '/xstream' },
    { key: 'xcloudflow', label: 'XCloudFlow', href: '/xcloudflow' },
    { key: 'xscopehub', label: 'XScopeHub', href: '/xscopehub' },
  ]

  if (isHiddenRoute) {
    return null
  }

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/95 text-slate-100 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 sm:px-8">
          <div className="flex items-center justify-center gap-5 py-3">
            <div className="flex flex-1 items-center justify-center gap-5">
              <Link href="/" className="flex items-center gap-2 rounded-md border border-white/5 bg-slate-900/60 px-2.5 py-1.5 text-sm font-medium text-white/90 transition hover:bg-slate-800/60">
                <Image
                  src="/icons/cloudnative_32.png"
                  alt="logo"
                  width={24}
                  height={24}
                  className="h-[20px] w-[20px] opacity-90"
                  unoptimized
                />
                <span className="text-sm font-medium opacity-90">Cloud-Neutral</span>
                <span className="rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                  Default config
                </span>
              </Link>
              <div className="hidden items-center gap-5 text-sm font-medium text-slate-200 lg:flex">
                {mainLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="text-sm opacity-80 transition hover:text-white hover:opacity-100"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  key={downloadLink.key}
                  href={downloadLink.href}
                  className="text-sm opacity-80 transition hover:text-white hover:opacity-100"
                >
                  {downloadLink.label}
                </Link>
                <div className="group relative">
                  <button className="flex items-center gap-1 text-sm opacity-80 transition hover:text-white hover:opacity-100">
                    <span>{labels.openSource}</span>
                    <svg
                      className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-200"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 top-full hidden min-w-[200px] translate-y-1 rounded-lg border border-white/10 bg-slate-900/95 py-2 text-sm text-slate-100 opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-200 group-hover:block group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:block group-focus-within:translate-y-2 group-focus-within:opacity-100">
                    {openSourceProjects.map((project) => (
                      <Link
                        key={project.key}
                        href={project.href}
                        className="block px-4 py-2 text-sm opacity-80 transition hover:bg-indigo-500/10 hover:text-white hover:opacity-100"
                      >
                        {project.label}
                      </Link>
                    ))}
                  </div>
                </div>
                {serviceItems.length > 0 ? (
                  <div className="group relative">
                    <button className="flex items-center gap-1 text-sm opacity-80 transition hover:text-white hover:opacity-100">
                      <span>{labels.moreServices}</span>
                      <svg
                        className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  <div className="absolute left-0 top-full hidden min-w-[200px] translate-y-1 rounded-lg border border-white/10 bg-slate-900/95 py-2 text-sm text-slate-100 opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-200 group-hover:block group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:block group-focus-within:translate-y-2 group-focus-within:opacity-100">
                    {serviceItems.map((child) => {
                      const isExternal = child.href.startsWith('http')
                      if (isExternal) {
                        return (
                          <a
                            key={child.key}
                            href={child.href}
                            className="flex items-center justify-between gap-2 px-4 py-2 text-sm opacity-80 transition hover:bg-indigo-500/10 hover:text-white hover:opacity-100"
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
                            className="flex items-center justify-between gap-2 px-4 py-2 text-sm opacity-80 transition hover:bg-indigo-500/10 hover:text-white hover:opacity-100"
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
              <SearchComponent className="relative w-full max-w-xs" />
              {user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] transition hover:from-indigo-400 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/60 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                  >
                    {accountInitial}
                  </button>
                  {accountMenuOpen ? (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                      <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-sm font-semibold text-white">{user.username}</p>
                        <p className="text-xs text-slate-300">{user.email}</p>
                      </div>
                      <div className="py-1 text-sm text-slate-100">
                        <Link
                          href="/panel"
                          className="block px-4 py-2 text-sm opacity-80 transition hover:bg-indigo-500/10 hover:opacity-100"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          {accountCopy.userCenter}
                        </Link>
                        <Link
                          href="/logout"
                          className="flex w-full items-center px-4 py-2 text-left text-sm text-rose-300 opacity-80 transition hover:bg-rose-500/10 hover:opacity-100"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          {accountCopy.logout}
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium text-slate-200">
                  <Link
                    href="/login"
                    className="text-sm opacity-80 transition hover:text-white hover:opacity-100"
                  >
                    {nav.account.login}
                  </Link>
                  <span className="h-3 w-px bg-white/20" aria-hidden="true" />
                  <Link
                    href="/register"
                    className="rounded-md border border-white/10 px-3 py-1 text-indigo-100 transition hover:border-indigo-300/40 hover:bg-white/5"
                  >
                    {nav.account.register}
                  </Link>
                </div>
              )}
              <Link
                href="/panel/mail"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-indigo-100 transition hover:border-indigo-300/50 hover:bg-indigo-500/10 hover:text-white lg:flex"
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
              className="flex items-center text-slate-100 focus:outline-none lg:hidden"
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
            <div className="flex flex-col gap-4 border-t border-white/10 bg-slate-900/80 py-3 text-slate-100 lg:hidden">
              <SearchComponent
                className="relative"
                buttonClassName="h-8 w-8"
                inputClassName="py-2 pr-12"
              />
              <div className="flex flex-col gap-2 text-sm font-medium">
                {mainLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="py-2 text-sm opacity-80 transition hover:opacity-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {serviceItems.length > 0 ? (
                  <div>
                    <button
                      className="flex w-full items-center justify-between py-2 text-sm opacity-80"
                      onClick={() => setMobileServicesOpen((prev) => !prev)}
                    >
                      <span>{labels.moreServices}</span>
                      <svg
                        className={`h-4 w-4 transform transition ${mobileServicesOpen ? 'rotate-180' : ''}`}
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
                      <div className="pl-4 text-sm text-slate-300">
                        {serviceItems.map((child) => {
                          const isExternal = child.href.startsWith('http')
                          if (isExternal) {
                            return (
                              <a
                                key={child.key}
                                href={child.href}
                                className="block py-2 text-sm opacity-80 transition hover:opacity-100"
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
                              className="block py-2 text-sm opacity-80 transition hover:opacity-100"
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
                <div className="rounded-xl border border-white/10 bg-slate-800/80 p-4 text-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-semibold text-white">
                      {accountInitial}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{user.username}</p>
                      <p className="text-xs text-slate-300">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/panel"
                    className="mt-3 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:border-indigo-300/50 hover:bg-indigo-500/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    {accountCopy.userCenter}
                  </Link>
                  <Link
                    href="/logout"
                    className="mt-3 inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:border-rose-300/60 hover:bg-rose-500/10 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:ring-offset-2 focus:ring-offset-slate-900"
                    onClick={() => setMenuOpen(false)}
                  >
                    {accountCopy.logout}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Link
                    href="/login"
                    className="py-2 text-sm opacity-80 transition hover:opacity-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    {nav.account.login}
                  </Link>
                  <span className="h-3 w-px bg-white/20" aria-hidden="true" />
                  <Link
                    href="/register"
                    className="rounded-md border border-white/10 px-3 py-1.5 text-indigo-100 transition hover:border-indigo-300/50 hover:bg-white/10"
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

    </>
  )
}

