'use client'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'

export default function Hero() {
  const { language } = useLanguage()
  const t = translations[language].hero

  return (
    <section className="hero py-20 bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 text-gray-900">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.title}</h1>
        <p className="text-lg md:text-xl mb-8 text-gray-700">{t.description}</p>
        <div className="flex justify-center gap-4">
          <a href="#get-started" className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-full text-white font-semibold">
            {t.start}
          </a>
          <a href="#features" className="border border-gray-900 px-6 py-3 rounded-full text-gray-900 hover:bg-gray-100">
            {t.learn}
          </a>
        </div>
      </div>
    </section>
  )
}
