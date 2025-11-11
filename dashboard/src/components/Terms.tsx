'use client'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'

export default function Terms() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section id="terms" className="py-20 bg-gray-100 text-gray-900">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">{t.termsTitle}</h2>
        <ul className="list-disc pl-5 space-y-2">
          {t.termsPoints.map((p, idx) => (
            <li key={idx} className="text-gray-700">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
