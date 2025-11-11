import { Github, MessageCircle, Newspaper, PlayCircle, QrCode } from 'lucide-react'
import Link from 'next/link'
import { forwardRef } from 'react'

import type { ProductConfig } from '@src/products/registry'

type ProductCommunityProps = {
  config: ProductConfig
  lang: 'zh' | 'en'
  qrUrl: string
  onQrUrlChange: (value: string) => void
  qrRef: React.RefObject<HTMLDivElement>
  posterRef: React.RefObject<HTMLDivElement>
  posterQrRef: React.RefObject<HTMLDivElement>
  onExportPoster: () => void | Promise<void>
}

const Poster = forwardRef<HTMLDivElement, { config: ProductConfig; lang: 'zh' | 'en'; posterQrRef: React.RefObject<HTMLDivElement> }>(
  ({ config, lang, posterQrRef }, ref) => {
    const tagline = lang === 'zh' ? config.tagline_zh : config.tagline_en

    return (
      <div
        ref={ref}
        className="fixed top-0 left-0 -translate-x-[150vw] w-[720px] max-w-full bg-white p-10 text-slate-900"
        aria-hidden="true"
      >
        <div className="flex h-full w-full flex-col justify-between rounded-3xl border border-slate-200 bg-gradient-to-b from-brand-surface to-white p-10 shadow-xl">
          <div>
            <div className="flex items-center gap-3 text-xl font-semibold text-slate-900">
              <QrCode className="h-6 w-6 text-brand-dark" aria-hidden="true" />
              <span>SVC.plus / {config.name}</span>
            </div>
            <h2 className="mt-8 text-5xl font-extrabold text-slate-900">
              {lang === 'zh' ? config.title : config.title_en}
            </h2>
            <p className="mt-4 text-lg text-slate-700">{tagline}</p>
            <ul className="mt-6 space-y-2 text-base text-slate-700">
              <li>• {lang === 'zh' ? 'Windows / macOS / Linux 全平台支持' : 'Windows / macOS / Linux support'}</li>
              <li>• {lang === 'zh' ? '官网 / 下载' : 'Website / Downloads'}: https://www.svc.plus/{config.slug}/</li>
            </ul>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-600">
                {lang === 'zh' ? '长按识别二维码' : 'Scan the QR code'}
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {lang === 'zh' ? '立即开始加速' : 'Start accelerating now'}
              </p>
            </div>
            <div ref={posterQrRef} className="rounded-2xl border border-slate-200 bg-white p-4" />
          </div>
        </div>
      </div>
    )
  }
)

Poster.displayName = 'Poster'

export default function ProductCommunity({
  config,
  lang,
  qrUrl,
  onQrUrlChange,
  qrRef,
  posterRef,
  posterQrRef,
  onExportPoster,
}: ProductCommunityProps) {
  return (
    <section id="community" aria-labelledby="community-title" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="community-title" className="text-3xl font-bold text-slate-900">
              {lang === 'zh' ? '社区与支持' : 'Community & Support'}
            </h2>
            <p className="mt-2 text-slate-600">
              {lang === 'zh'
                ? '加入开发者社区，获取教程、博客、视频等资源。'
                : 'Join the community for tutorials, blog posts, and guided videos.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={config.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                GitHub
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={onExportPoster}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {lang === 'zh' ? '分享海报' : 'Share poster'}
              </button>
              <Link
                href={config.blogUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Newspaper className="h-4 w-4" aria-hidden="true" />
                {lang === 'zh' ? '官方博客' : 'Official blog'}
              </Link>
              <Link
                href={config.videosUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                {lang === 'zh' ? '视频教程' : 'Video tutorials'}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              {lang === 'zh' ? '扫码体验' : 'Scan to try'}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {lang === 'zh'
                ? '保存或分享二维码，适用于微信等内置浏览器。'
                : 'Save or share the QR code—works in embedded browsers like WeChat.'}
            </p>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row">
              <div className="flex flex-col items-center gap-3">
                <div
                  ref={qrRef}
                  className="flex h-[180px] w-[180px] items-center justify-center rounded-xl border border-slate-200 bg-white"
                  aria-label={lang === 'zh' ? '产品二维码' : 'Product QR code'}
                />
                <span className="text-xs text-slate-500">{qrUrl}</span>
              </div>
              <div className="flex-1 space-y-3 text-sm text-slate-700">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {lang === 'zh' ? '自定义跳转链接' : 'Custom URL'}
                  </span>
                  <input
                    value={qrUrl}
                    onChange={(event) => onQrUrlChange(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                  />
                </label>
                <button
                  type="button"
                  onClick={onExportPoster}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  {lang === 'zh' ? '导出海报' : 'Export poster'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Poster config={config} lang={lang} posterQrRef={posterQrRef} ref={posterRef} />
    </section>
  )
}
