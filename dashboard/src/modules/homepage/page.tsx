'use client'

import clsx from 'clsx'

import Features from '@components/Features'
import OpenSource from '@components/OpenSource'
import DownloadSection from '@components/DownloadSection'
import CommunityFeed from '@components/home/CommunityFeed'
import Sidebar from '@components/home/Sidebar'
import { designTokens } from '@theme/designTokens'

import { useLanguage } from '../../i18n/LanguageProvider'
import { loadHeroContent, type HeroContent } from '../../lib/content-loader'

export default function Homepage() {
  const { language } = useLanguage()
  const content = loadHeroContent('homepage', undefined, language)

  if (!content) {
    return (
      <main className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500">Content not found</div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white/90 py-20 shadow-sm sm:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-5xl rounded-full bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 blur-3xl" />
        <div className={clsx('relative', designTokens.layout.container)}>
          <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-10 lg:items-stretch">
            <div className="min-h-full space-y-8">
              <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                {content.eyebrow}
              </span>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{content.title}</h1>
                <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">{content.description}</p>
              </div>
              {content.focusAreas && (
                <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  {content.focusAreas.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden />
                      <span className="font-medium text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {content.products && (
                <div className="grid gap-4">
                  {content.products.map((product) => (
                    <div
                      key={product.label}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">{product.label}</span>
                      <h3 className="text-lg font-semibold text-slate-900">{product.headline}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
                      <a
                        href={product.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-brand transition hover:text-brand-dark"
                      >
                        {content.ctaLabel} →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="lg:sticky lg:top-0 lg:h-fit lg:w-[360px]">
              <Sidebar />
            </div>
          </div>
        </div>
      </section>
      <Features variant="homepage" />
      <OpenSource variant="homepage" />
      <DownloadSection variant="homepage" />
    </main>
  )
}
