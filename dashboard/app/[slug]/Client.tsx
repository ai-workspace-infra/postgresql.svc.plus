'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import html2canvas from 'html2canvas'
type QRCodeToCanvas = (
  canvas: HTMLCanvasElement,
  text: string,
  options?: Record<string, unknown>
) => Promise<unknown>

import ProductCommunity from '@components/marketing/ProductCommunity'
import ProductDocs from '@components/marketing/ProductDocs'
import ProductDownload from '@components/marketing/ProductDownload'
import ProductEditions from '@components/marketing/ProductEditions'
import ProductFaq from '@components/marketing/ProductFaq'
import ProductFeatures from '@components/marketing/ProductFeatures'
import ProductHero from '@components/marketing/ProductHero'
import ProductScenarios from '@components/marketing/ProductScenarios'
import type { ProductConfig } from '@src/products/registry'

export type Lang = 'zh' | 'en'

const drawQR = async (
  node: HTMLElement | null,
  url: string,
  size: number = 180
) => {
  if (!node) {
    return
  }

  node.innerHTML = ''
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  try {
    const { toCanvas } = (await import('qrcode')) as unknown as {
      toCanvas: QRCodeToCanvas
    }

    await toCanvas(canvas, url, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'H',
    })
    node.appendChild(canvas)
  } catch (error) {
    console.error('Failed to render QR code', error)
  }
}

const exportPoster = async (node: HTMLElement | null, slug: string) => {
  if (!node) {
    return
  }

  const canvas = await html2canvas(node, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  })

  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.download = `${slug}-poster-${date}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

type ClientProps = {
  config: ProductConfig
}

export default function Client({ config }: ClientProps) {
  const [lang, setLang] = useState<Lang>('zh')
  const defaultQrUrl = useMemo(
    () => `https://www.svc.plus/${config.slug}/`,
    [config.slug]
  )
  const [qrUrl, setQrUrl] = useState(defaultQrUrl)

  const qrRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const posterQrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const preferred = navigator.language?.toLowerCase().startsWith('en')
        ? 'en'
        : 'zh'
      setLang(preferred)
    }
  }, [])

  useEffect(() => {
    setQrUrl(defaultQrUrl)
  }, [defaultQrUrl])

  useEffect(() => {
    drawQR(qrRef.current, qrUrl, 180)
    drawQR(posterQrRef.current, qrUrl, 220)
  }, [qrUrl])

  const handleToggleLanguage = useCallback(() => {
    setLang((current) => (current === 'zh' ? 'en' : 'zh'))
  }, [])

  const handleExportPoster = useCallback(() => {
    return exportPoster(posterRef.current, config.slug)
  }, [config.slug])

  const handleQrUpdate = useCallback(
    (value: string) => {
      setQrUrl(value || defaultQrUrl)
    },
    [defaultQrUrl]
  )

  return (
    <div className="bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-slate-500">SVC.plus</span>
            <span className="text-slate-400">/</span>
            <span className="text-brand-dark">{config.name}</span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="#features" scroll>
              {lang === 'zh' ? '核心功能' : 'Features'}
            </Link>
            <Link href="#editions" scroll>
              {lang === 'zh' ? '版本与部署' : 'Editions'}
            </Link>
            <Link href="#scenarios" scroll>
              {lang === 'zh' ? '应用场景' : 'Scenarios'}
            </Link>
            <Link href="#download" scroll>
              {lang === 'zh' ? '下载' : 'Download'}
            </Link>
            <Link href="#docs" scroll>
              {lang === 'zh' ? '文档' : 'Docs'}
            </Link>
            <Link href="#faq" scroll>
              {lang === 'zh' ? 'FAQ' : 'FAQ'}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLanguage}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              aria-label={lang === 'zh' ? 'Switch to English' : '切换到中文'}
            >
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
            <Link
              href="#download"
              scroll
              className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              {lang === 'zh' ? '立即下载' : 'Download'}
            </Link>
          </div>
        </div>
      </header>
      <main>
        <ProductHero config={config} lang={lang} onExportPoster={handleExportPoster} />
        <ProductFeatures lang={lang} />
        <ProductEditions config={config} lang={lang} />
        <ProductScenarios lang={lang} />
        <ProductDownload config={config} lang={lang} />
        <ProductDocs config={config} lang={lang} />
        <ProductFaq lang={lang} />
        <ProductCommunity
          config={config}
          lang={lang}
          qrUrl={qrUrl}
          onQrUrlChange={handleQrUpdate}
          qrRef={qrRef}
          posterRef={posterRef}
          posterQrRef={posterQrRef}
          onExportPoster={handleExportPoster}
        />
      </main>
    </div>
  )
}
