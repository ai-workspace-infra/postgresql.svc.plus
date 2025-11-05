
import { useLanguage } from '@i18n/LanguageProvider.tsx'
import { translations } from '@i18n/translations.ts'

export default function DownloadNotFound() {
  const { language } = useLanguage()
  const message = translations[language].download.listing.notFound

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-dashed p-10 text-center text-sm text-red-500">
      {message}
    </div>
  )
}
