import Link from 'next/link'
import { Laptop, Monitor, Server } from 'lucide-react'

import type { ProductConfig } from '@src/products/registry'

type ProductDownloadProps = {
  config: ProductConfig
  lang: 'zh' | 'en'
}

const PLATFORMS = {
  zh: [
    {
      key: 'windows',
      title: 'Windows',
      subtitle: 'Win10/11 · x64 / ARM64',
      icon: Monitor,
    },
    {
      key: 'mac',
      title: 'macOS',
      subtitle: 'macOS 12+ · Intel / Apple Silicon',
      icon: Laptop,
    },
    {
      key: 'linux',
      title: 'Linux',
      subtitle: 'Ubuntu / Debian / RHEL · x64 / ARM64',
      icon: Server,
    },
  ],
  en: [
    {
      key: 'windows',
      title: 'Windows',
      subtitle: 'Windows 10/11 · x64 / ARM64',
      icon: Monitor,
    },
    {
      key: 'mac',
      title: 'macOS',
      subtitle: 'macOS 12+ · Intel / Apple Silicon',
      icon: Laptop,
    },
    {
      key: 'linux',
      title: 'Linux',
      subtitle: 'Ubuntu / Debian / RHEL · x64 / ARM64',
      icon: Server,
    },
  ],
}

export default function ProductDownload({ config, lang }: ProductDownloadProps) {
  const items = PLATFORMS[lang]

  return (
    <section id="download" aria-labelledby="download-title" className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h2 id="download-title" className="text-3xl font-bold text-slate-900">
            {lang === 'zh' ? '下载' : 'Download'}
          </h2>
          <p className="mt-2 text-slate-600">
            {lang === 'zh'
              ? '支持 Windows / macOS / Linux，安装前请核验校验值。'
              : 'Windows, macOS, and Linux builds. Verify checksums before install.'}
          </p>
        </header>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map(({ key, title, subtitle, icon: Icon }) => (
            <article key={key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900">
                <Icon className="h-5 w-5 text-brand-dark" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={config.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  {lang === 'zh' ? '下载' : 'Get'}
                </Link>
                <Link
                  href="#docs"
                  scroll
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  SHA256
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
