'use client'
import { usePathname } from 'next/navigation'

import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'
import { useTheme } from './theme/useTheme'

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
  const { isDark, toggleTheme, theme } = useTheme()

  const socialLinks = [
    { label: 'GitHub', href: 'https://github.com/CloudNativeSuite', icon: 'GH' },
    { label: 'X', href: 'https://x.com', icon: 'X' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: 'in' },
    { label: 'Mail', href: 'mailto:manbuzhe2008@gmail.com', icon: '✉' },
  ]

  return (
    <footer className="border-t border-white/5 bg-[#0a0f1f] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-center text-sm text-white/70 sm:text-left">
            {language === 'zh'
              ? '保持云中立，随时安全上线。'
              : 'Stay cloud-neutral and ship securely at all times.'}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
              >
                <span aria-hidden>{link.icon}</span>
              </a>
            ))}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
            >
              <span className="text-lg" aria-hidden>
                {isDark ? '☾' : '☀'}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-white/80">
                {language === 'zh' ? '夜间切换' : 'Night switch'}
              </span>
              <span className="sr-only">{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 text-xs text-white/60 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <a href="#privacy" className="transition hover:text-white">
              {privacy}
            </a>
            <span aria-hidden className="text-white/30">
              •
            </span>
            <a href="#terms" className="transition hover:text-white">
              {terms}
            </a>
            <span aria-hidden className="text-white/30">
              •
            </span>
            <a href="#contact" className="transition hover:text-white">
              {contact}
            </a>
          </div>
          <span className="text-center sm:text-right">© 2025 Cloud-Neutral</span>
        </div>
      </div>
    </footer>
  )
}
