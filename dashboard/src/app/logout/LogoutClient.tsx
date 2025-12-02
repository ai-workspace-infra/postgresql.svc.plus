'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import { useUserStore } from '@lib/userStore'

export function LogoutClient() {
  const router = useRouter()
  const logout = useUserStore((state) => state.logout)
  const { language } = useLanguage()
  const navCopy = translations[language].nav.account
  const signingOutMessage = language === 'zh' ? '正在安全退出，请稍候…' : 'Signing you out safely. One moment…'

  useEffect(() => {
    let cancelled = false

    const performLogout = async () => {
      try {
        await logout()
      } finally {
        if (!cancelled) {
          router.replace('/')
          router.refresh()
        }
      }
    }

    void performLogout()

    return () => {
      cancelled = true
    }
  }, [logout, router])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-gray-100">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <svg
              aria-hidden
              className="h-6 w-6 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900">{navCopy.logout}</h1>
          <p className="mt-3 text-sm text-gray-600">{signingOutMessage}</p>
        </div>
      </main>
    </div>
  )
}
