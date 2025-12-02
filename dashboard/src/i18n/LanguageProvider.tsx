'use client'

import { useEffect } from 'react'
import { create } from 'zustand'

export type Language = 'en' | 'zh'

type LanguageState = {
  language: Language
  setLanguage: (lang: Language) => void
  hydrateLanguage: () => void
}

const STORAGE_KEY = 'cloudnative-suite.language'

function detectPreferredLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'zh'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'zh') {
    return stored
  }

  const [primaryLocale] = window.navigator.languages?.length
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

  return 'zh'
}

function syncDocumentLanguage(language: Language) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = language
  document.documentElement.dataset.language = language
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: detectPreferredLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, language)
    }
    syncDocumentLanguage(language)
    set({ language })
  },
  hydrateLanguage: () => {
    const preferred = detectPreferredLanguage()
    syncDocumentLanguage(preferred)
    set({ language: preferred })
  },
}))

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((state) => state.language)
  const hydrateLanguage = useLanguageStore((state) => state.hydrateLanguage)

  useEffect(() => {
    hydrateLanguage()
  }, [hydrateLanguage])

  useEffect(() => {
    syncDocumentLanguage(language)
  }, [language])

  return children
}

export function useLanguage() {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  return { language, setLanguage }
}
