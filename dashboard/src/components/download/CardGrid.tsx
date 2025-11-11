'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import { formatDate } from '../../lib/format'
import { formatSegmentLabel } from '../../lib/download-data'

interface Section {
  key: string
  title: string
  href: string
  lastModified?: string
  count?: number
  root?: string
}

export default function CardGrid({ sections }: { sections: Section[] }) {
  const { language } = useLanguage()
  const locale = language === 'zh' ? 'zh-CN' : 'en-US'
  const t = translations[language].download.cardGrid
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'lastModified' | 'title'>('lastModified')

  const filtered = useMemo(() => {
    return sections
      .filter((section) => section.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) =>
        sort === 'title'
          ? a.title.localeCompare(b.title, locale)
          : new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime(),
      )
  }, [sections, search, sort, locale])

  return (
    <div>
      <div className="sticky top-20 z-10 mb-4 flex items-center gap-2 border-b bg-white pb-2">
        <select className="rounded border p-2" value={sort} onChange={(event) => setSort(event.target.value as any)}>
          <option value="lastModified">{t.sortUpdated}</option>
          <option value="title">{t.sortName}</option>
        </select>
        <div className="ml-auto">
          <input
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded border p-2"
          />
        </div>
      </div>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {filtered.map((section) => (
          <Link
            key={section.key}
            href={section.href}
            className="mb-4 block break-inside-avoid rounded-3xl border bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex flex-col gap-3">
              {section.root && (
                <span className="inline-flex w-fit items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600">
                  {formatSegmentLabel(section.root)}
                </span>
              )}
              <div className="text-4xl font-bold text-gray-900">{section.title.charAt(0).toUpperCase()}</div>
              <div className="text-base font-semibold text-gray-900">{section.title}</div>
              <div className="space-y-1 text-xs text-gray-600">
                {section.lastModified && (
                  <p>
                    <span>{t.updatedLabel}</span>
                    <span className="ml-1">{formatDate(section.lastModified, locale)}</span>
                  </p>
                )}
                {section.count !== undefined && (
                  <p>
                    <span>{t.itemsLabel}</span>
                    <span className="ml-1">{section.count.toLocaleString(locale)}</span>
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
