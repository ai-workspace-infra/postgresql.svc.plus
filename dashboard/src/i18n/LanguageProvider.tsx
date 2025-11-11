'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Language = 'en' | 'zh'

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
}

const STORAGE_KEY = 'cloudnative-suite.language'

const LanguageContext = createContext<LanguageContextType>({
  language: 'zh',
  setLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'zh') {
        return stored
      }

      const [primaryLocale] = window.navigator.languages && window.navigator.languages.length
        ? window.navigator.languages
        : [window.navigator.language]
      if (typeof primaryLocale === 'string') {
        const normalized = primaryLocale.toLowerCase()
        if (normalized.startsWith('en')) {
          return 'en'
        }
        if (normalized.startsWith('zh')) {
          return 'zh'
        }
      }
    }
    return 'zh'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, language)
    }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
