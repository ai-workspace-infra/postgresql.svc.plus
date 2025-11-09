import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Download, QrCode } from 'lucide-react'

import type { ProductConfig } from '@src/products/registry'

type ProductHeroProps = {
  config: ProductConfig
  lang: 'zh' | 'en'
  onExportPoster: () => void | Promise<void>
}

export default function ProductHero({ config, lang, onExportPoster }: ProductHeroProps) {
  const tagline = lang === 'zh' ? config.tagline_zh : config.tagline_en
  const primaryCta = lang === 'zh' ? '下载客户端' : 'Get the App'
  const secondaryCta = lang === 'zh' ? '快速开始' : 'Quickstart'
  const posterCta = lang === 'zh' ? '生成推广海报' : 'Create Poster'
  const badges =
    lang === 'zh'
      ? ['开源', '自建', '托管', '按量计费', '订阅 SaaS']
      : ['Open Source', 'Self-Hosted', 'Managed', 'Pay-as-you-go', 'SaaS']

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-surface/70 to-white" aria-labelledby="product-hero">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(44,137,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
            {config.name}
          </p>
          <h1 id="product-hero" className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {lang === 'zh' ? config.title : config.title_en}
          </h1>
          <p className="mt-5 text-lg text-slate-600">{tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#download"
              scroll
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-dark"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {primaryCta}
            </Link>
            <Link
              href="#docs"
              scroll
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {secondaryCta}
            </Link>
            <button
              type="button"
              onClick={onExportPoster}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
              {posterCta}
            </button>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
            {badges.map((badge) => (
              <li key={badge} className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">
                {badge}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex flex-1 justify-center lg:justify-end">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1526498460520-4c246339dccb?q=80&w=1600&auto=format&fit=crop"
              alt={lang === 'zh' ? `${config.name} 网络示意图` : `${config.name} network illustration`}
              width={720}
              height={480}
              className="h-full w-full object-cover"
              priority
            />
            <div className="absolute bottom-4 left-4 rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur">
              {lang === 'zh' ? 'AI 路由优化开启中…' : 'AI route optimization active…'}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
