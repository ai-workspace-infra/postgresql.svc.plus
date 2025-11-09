import Image from 'next/image'
import { BookOpen, Download, QrCode } from 'lucide-react'

import type { ProductConfig } from '@src/products/registry'
import Hero from '@components/Hero'

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

  const media = (
    <div className="relative flex flex-1 justify-center lg:justify-end">
      <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-white shadow-2xl">
        <Image
          src="https://images.unsplash.com/photo-1526498460520-4c246339dccb?q=80&w=1600&auto=format&fit=crop"
          alt={lang === 'zh' ? `${config.name} 网络示意图` : `${config.name} network illustration`}
          width={720}
          height={480}
          className="h-full w-full object-cover"
          priority
        />
        <div className="absolute bottom-4 left-4 rounded-lg border border-brand-border bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur">
          {lang === 'zh' ? 'AI 路由优化开启中…' : 'AI route optimization active…'}
        </div>
      </div>
    </div>
  )

  const decoration = (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(44,137,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]"
    />
  )

  return (
    <Hero
      variant="product"
      eyebrow={config.name}
      title={lang === 'zh' ? config.title : config.title_en}
      description={tagline}
      primaryCta={{ label: primaryCta, href: '#download', icon: <Download className="h-4 w-4" aria-hidden="true" /> }}
      secondaryCta={{ label: secondaryCta, href: '#docs', icon: <BookOpen className="h-4 w-4" aria-hidden="true" /> }}
      tertiaryCta={{ label: posterCta, onClick: onExportPoster, icon: <QrCode className="h-4 w-4" aria-hidden="true" /> }}
      badges={badges}
      media={media}
      decoration={decoration}
    />
  )
}
