
import { useMemo, useState } from 'preact/hooks'
import Breadcrumbs, { Crumb } from './Breadcrumbs.tsx'
import CopyButton from './CopyButton.tsx'
import { useLanguage } from '@i18n/LanguageProvider.tsx'
import { translations } from '@i18n/translations.ts'
import { formatBytes, formatDate } from '../../lib/format.ts'
import type { DirListing } from '../../types/download.ts'

interface FileTableProps {
  listing: DirListing
  breadcrumb: Crumb[]
  showBreadcrumbs?: boolean
}

export default function FileTable({ listing, breadcrumb, showBreadcrumbs = true }: FileTableProps) {
  const { language } = useLanguage()
  const locale = language === 'zh' ? 'zh-CN' : 'en-US'
  const t = translations[language].download.fileTable
  const copyLabel = translations[language].download.copyButton.tooltip
  const [sort, setSort] = useState<'name' | 'lastModified' | 'size'>('name')
  const [ext, setExt] = useState('')

  const filtered = useMemo(() => {
    return listing.entries
      .filter((item) => !ext || item.name.toLowerCase().endsWith(ext.toLowerCase()))
      .sort((a, b) => {
        switch (sort) {
          case 'lastModified':
            return new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
          case 'size':
            return (b.size || 0) - (a.size || 0)
          default:
            return a.name.localeCompare(b.name, locale)
        }
      })
  }, [listing.entries, sort, ext, locale])

  return (
    <div>
      {showBreadcrumbs && <Breadcrumbs items={breadcrumb} />}
      <div className="mb-2 flex flex-wrap gap-2">
        <select className="rounded border p-2" value={sort} onChange={(event) => setSort(event.target.value as any)}>
          <option value="name">{t.sortName}</option>
          <option value="lastModified">{t.sortUpdated}</option>
          <option value="size">{t.sortSize}</option>
        </select>
        <input
          className="rounded border p-2"
          placeholder={t.filterPlaceholder}
          value={ext}
          onChange={(event) => setExt(event.target.value)}
        />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">{t.headers.name}</th>
            <th className="w-24 py-2 text-left">{t.headers.size}</th>
            <th className="w-48 py-2 text-left">{t.headers.updated}</th>
            <th className="w-40 py-2 text-left">{t.headers.actions}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => {
            const downloadUrl = item.href.startsWith('http') ? item.href : `https://dl.svc.plus${item.href}`

            return (
              <tr key={item.name} className="border-b last:border-0">
                <td className="py-1">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {item.name}
                  </a>
                </td>
                <td className="py-1">{formatBytes(item.size || 0)}</td>
                <td className="py-1">{item.lastModified ? formatDate(item.lastModified, locale) : '--'}</td>
                <td className="py-1">
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={downloadUrl} label={copyLabel} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
