
import { useLanguage } from '@i18n/LanguageProvider.tsx'
import { translations } from '@i18n/translations.ts'

type DownloadSummaryProps = {
  topLevelCount: number
  totalCollections: number
  totalFiles: number
}

export default function DownloadSummary({
  topLevelCount,
  totalCollections,
  totalFiles,
}: DownloadSummaryProps) {
  const { language } = useLanguage()
  const locale = language === 'zh' ? 'zh-CN' : 'en-US'
  const t = translations[language].download.home
  const stats = [
    { label: t.stats.categories, value: topLevelCount },
    { label: t.stats.collections, value: totalCollections },
    { label: t.stats.files, value: totalFiles },
  ]

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-white to-white p-8 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{t.title}</h1>
          <p className="max-w-2xl text-sm text-gray-600 md:text-base">{t.description}</p>
        </div>
        <dl className="grid flex-1 gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-purple-100 bg-white/80 p-4 text-sm shadow-sm"
            >
              <dt className="text-gray-500">{item.label}</dt>
              <dd className="mt-2 text-2xl font-semibold text-gray-900">
                {item.value.toLocaleString(locale)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
