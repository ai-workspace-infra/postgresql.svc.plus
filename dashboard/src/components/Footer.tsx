'use client'
import { BookOpen, Github, Globe, Link, MessageCircle, Sparkles, Moon, Sun } from 'lucide-react'

import { useTheme } from '@theme/useTheme'

export default function Footer() {
  const { isDark, toggleTheme } = useTheme()
  const socials = [
    { label: 'GitHub', icon: Github, href: 'https://github.com/CloudNativeSuite/' },
    { label: 'Docs', icon: BookOpen, href: '#' },
    { label: 'Globe', icon: Globe, href: '#' },
    { label: 'API', icon: Link, href: '#' },
    { label: '微信公众号', icon: MessageCircle, href: '#' },
    { label: '小红书', icon: Sparkles, href: '#' },
  ]

  const toggleLabel = isDark ? '切换为浅色主题' : '切换为深色主题'

  return (
    <footer className="mt-12 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
      <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center justify-center gap-3">
          {socials.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-indigo-400/50 hover:text-indigo-100"
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="sr-only">{label}</span>
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="group relative flex h-10 w-20 items-center rounded-full border border-white/10 bg-white/5 px-2 text-white transition hover:border-indigo-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <span className="relative z-10 flex w-full items-center justify-between text-slate-300">
            <Moon
              className={`h-4 w-4 transition-colors ${isDark ? 'text-indigo-100' : 'text-slate-500'}`}
              aria-hidden
            />
            <Sun
              className={`h-4 w-4 transition-colors ${isDark ? 'text-slate-500' : 'text-amber-300'}`}
              aria-hidden
            />
          </span>
          <span
            aria-hidden
            className={`absolute inset-y-1 left-1 h-8 w-8 rounded-full bg-white/90 shadow-sm transition-transform duration-300 ease-out ${isDark ? 'translate-x-0' : 'translate-x-10'}`}
          />
        </button>
      </div>
    </footer>
  )
}
