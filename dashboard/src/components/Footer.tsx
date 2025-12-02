'use client'
import { usePathname } from 'next/navigation'

import { BookOpen, Github, Globe, Link as LinkIcon, ShieldCheck } from 'lucide-react'
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

  const socialLinks = [
    { label: 'GitHub', href: 'https://github.com/CloudNativeSuite', icon: Github },
    { label: language === 'zh' ? '文档' : 'Docs', href: '/docs', icon: BookOpen },
    { label: 'Website', href: 'https://cloudneutralsuite.example', icon: Globe },
    { label: 'API', href: '/api', icon: LinkIcon },
  ]

  return (
    <footer className="border-t border-white/10 bg-slate-950/95 text-slate-200">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_0,rgba(14,165,233,0.12),transparent_30%)]" aria-hidden />
        <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden />
              <span className="font-semibold">Cloud-Neutral</span>
            </div>
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-100">
              {language === 'zh' ? '云原生安全' : 'Cloud native security'}
            </span>
            <span className="text-slate-500">© 2025</span>
          </div>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-indigo-400/50 hover:text-indigo-100"
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="sr-only">{label}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="relative flex flex-col items-center gap-3 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <a href="#privacy" className="transition hover:text-white">
              {privacy}
            </a>
            <span aria-hidden className="text-white/20">
              •
            </span>
            <a href="#terms" className="transition hover:text-white">
              {terms}
            </a>
            <span aria-hidden className="text-white/20">
              •
            </span>
            <a href="#contact" className="transition hover:text-white">
              {contact}
            </a>
          </div>
          <span className="text-center sm:text-right">
            {language === 'zh' ? '保持云中立，随时安全上线。' : 'Stay cloud-neutral and ship securely at all times.'}
          </span>
        </div>
      </div>
    </footer>
  )
}
