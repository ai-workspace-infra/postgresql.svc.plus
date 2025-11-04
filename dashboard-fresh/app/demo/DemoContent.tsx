'use client'

import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'

export default function DemoContent() {
  const { language } = useLanguage()
  const { account } = translations[language].nav

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">{account.demo}</h1>
    </div>
  )
}
