'use client'
import { usePathname } from 'next/navigation'

import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'

const HIDDEN_PATH_PREFIXES = ['/login', '/register']

export default function Footer() {
  const pathname = usePathname()
  const isHidden = pathname ? HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) : false
  if (isHidden) {
    return null
  }

  const { language } = useLanguage()
  const t = translations[language].footerLinks
  const [privacy, terms, contact] = t

  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-8 py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-light/90">CloudNative Suite</p>
            <p className="max-w-lg text-sm text-white/70">
              Unified observability, DevOps, and AI workflows for enterprise cloud native teams.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              <a href="#privacy" className="transition hover:text-brand-light">
                {privacy}
              </a>
              <a href="#terms" className="transition hover:text-brand-light">
                {terms}
              </a>
              <a href="#contact" className="transition hover:text-brand-light">
                {contact}
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-6 text-sm">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">GitHub</p>
              <a
                href="https://github.com/CloudNativeSuite"
                className="inline-flex items-center gap-2 text-white/80 transition hover:text-brand-light"
                target="_blank"
                rel="noreferrer"
              >
                <span>github.com/CloudNativeSuite</span>
              </a>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">公众号</p>
              <span className="text-white/80">CloudNative Suite 官方资讯</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Contact</p>
              <a href="mailto:manbuzhe2008@gmail.com" className="text-white/80 transition hover:text-brand-light">
                manbuzhe2008@gmail.com
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2025 CloudNative Suite. All rights reserved.</span>
          <span>Build with confidence in the cloud native era.</span>
        </div>
      </div>
    </footer>
  )
}
