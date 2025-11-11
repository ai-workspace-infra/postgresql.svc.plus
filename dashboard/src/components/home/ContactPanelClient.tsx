'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Mail,
  MessageCircle,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

import type { ContactPanelContent, ContactItemContent } from '@cms/content'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'

const iconMap: Record<string, LucideIcon> = {
  mail: Mail,
  'life-buoy': LifeBuoy,
  star: Star,
}

function getIcon(name?: string): LucideIcon {
  if (!name) {
    return MessageCircle
  }
  const normalized = name.toLowerCase()
  return iconMap[normalized] ?? MessageCircle
}

type ContactPanelClientProps = {
  panel: ContactPanelContent
  className?: string
}

const QR_GRID_SIZE = 21
const FINDER_SIZE = 7

function createPseudoQrPattern(value: string): boolean[][] {
  const size = QR_GRID_SIZE
  const pattern: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false))

  let seed = 0
  for (let index = 0; index < value.length; index += 1) {
    seed = (seed * 31 + value.charCodeAt(index)) >>> 0
  }
  seed ^= value.length << 7

  const finderAnchors: Array<[number, number]> = [
    [0, 0],
    [size - FINDER_SIZE, 0],
    [0, size - FINDER_SIZE],
  ]

  const isFinder = (x: number, y: number) => {
    for (const [px, py] of finderAnchors) {
      if (x >= px && x < px + FINDER_SIZE && y >= py && y < py + FINDER_SIZE) {
        const innerX = x - px
        const innerY = y - py
        if (innerX === 0 || innerX === FINDER_SIZE - 1 || innerY === 0 || innerY === FINDER_SIZE - 1) {
          return true
        }
        if (innerX >= 2 && innerX <= FINDER_SIZE - 3 && innerY >= 2 && innerY <= FINDER_SIZE - 3) {
          return true
        }
        return false
      }
    }
    return false
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (isFinder(x, y)) {
        pattern[y][x] = true
        continue
      }
      seed = (seed * 1664525 + 1013904223) >>> 0
      const threshold = seed & 0xff
      pattern[y][x] = threshold % 3 !== 0
    }
  }

  return pattern
}

type QrPreviewProps = {
  item: ContactItemContent
  qrAltSuffix: string
}

function QrPreview({ item, qrAltSuffix }: QrPreviewProps) {
  const pattern = useMemo(
    () => (item.qrImage ? undefined : createPseudoQrPattern(item.qrValue ?? item.slug)),
    [item.qrImage, item.qrValue, item.slug],
  )
  const size = pattern?.length ?? QR_GRID_SIZE

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="relative aspect-square w-full">
          {item.qrImage ? (
            <Image
              src={item.qrImage}
              alt={`${item.title}${qrAltSuffix}`}
              fill
              sizes="(min-width: 640px) 240px, 70vw"
              className="object-contain"
            />
          ) : (
            <div
              className="grid h-full w-full"
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
                gap: '1px',
              }}
              aria-hidden
            >
              {pattern!.flat().map((isFilled, index) => (
                <span key={`${item.slug}-${index}`} className={`block ${isFilled ? 'bg-brand-navy' : 'bg-brand-surface'}`} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
        {item.description ? <p className="text-xs text-brand-heading/70">{item.description}</p> : null}
      </div>
    </div>
  )
}

function InfoCard({ item }: { item: ContactItemContent }) {
  const Icon = getIcon(item.icon)
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="mt-1 rounded-full bg-brand-surface p-2 text-brand">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
        {item.description ? <p className="mt-1 text-xs text-brand-heading/70">{item.description}</p> : null}
        {item.bodyHtml ? (
          <div
            className="prose prose-sm mt-2 max-w-none text-brand-heading/80 [&_a]:text-brand [&_a]:no-underline hover:[&_a]:underline"
            dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
          />
        ) : null}
        {item.ctaLabel && item.ctaHref ? (
          <Link
            href={item.ctaHref}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-light"
          >
            {item.ctaLabel}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export default function ContactPanelClient({ panel, className }: ContactPanelClientProps) {
  const { language } = useLanguage()
  const contactMarketing = translations[language].marketing.home.contactPanel
  const [collapsed, setCollapsed] = useState(false)

  const localizedPanel = useMemo(() => {
    const overrides = contactMarketing.items ?? {}
    const localizedItems = panel.items.map((item) => {
      const override = overrides[item.slug]
      if (!override) {
        return item
      }
      return {
        ...item,
        title: override.title ?? item.title,
        description: override.description ?? item.description,
        bodyHtml: override.bodyHtml ?? item.bodyHtml,
        ctaLabel: override.ctaLabel ?? item.ctaLabel,
      }
    })

    return {
      ...panel,
      title: contactMarketing.title ?? panel.title,
      subtitle: contactMarketing.subtitle ?? panel.subtitle,
      items: localizedItems,
    }
  }, [contactMarketing.items, contactMarketing.subtitle, contactMarketing.title, panel])

  if (!localizedPanel.items.length) {
    return null
  }

  return (
    <div className={clsx('w-full lg:h-full lg:min-h-0', className)}>
      {collapsed ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="group inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition hover:border-brand hover:text-brand-light"
            aria-label={contactMarketing.expandLabel}
          >
            <span>{contactMarketing.buttonLabel}</span>
            <ChevronLeft className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </button>
        </div>
      ) : (
        <section className="relative flex max-h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" aria-hidden />
          <div className="flex items-start justify-between gap-3 px-6 pt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand">{localizedPanel.title}</p>
              {localizedPanel.subtitle ? (
                <p className="mt-1 text-xs text-brand-heading/70">{localizedPanel.subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded-full border border-brand-border bg-white p-1 text-brand-heading/60 transition hover:border-brand hover:text-brand"
              aria-label={contactMarketing.collapseLabel}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {localizedPanel.bodyHtml ? (
              <div
                className="prose prose-sm px-6 pt-4 text-brand-heading/80"
                dangerouslySetInnerHTML={{ __html: localizedPanel.bodyHtml }}
              />
            ) : null}
            <div className="grid gap-4 px-6 pb-6 pt-4 sm:grid-cols-2">
              {localizedPanel.items.map((item) => {
                if (item.type === 'qr') {
                  return (
                    <div key={item.slug} className="sm:flex sm:flex-col">
                      <QrPreview item={item} qrAltSuffix={contactMarketing.qrAltSuffix} />
                    </div>
                  )
                }
                return (
                  <div key={item.slug} className="sm:col-span-2">
                    <InfoCard item={item} />
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
