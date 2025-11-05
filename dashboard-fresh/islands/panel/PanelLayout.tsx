/**
 * PanelLayout Island - Fresh + Preact
 *
 * Layout wrapper for panel pages with sidebar and header
 */

import { useSignal, useComputed } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import Sidebar from '@/islands/panel/Sidebar.tsx'
import Header from '@/islands/panel/Header.tsx'
import type { ComponentChildren } from 'preact'
import type { User } from '@/lib/userSession.ts'
import { logoutUser, fetchSessionUser } from '@/lib/userSession.ts'
import { user as userSignal } from '@/lib/userStore.tsx'

interface PanelLayoutProps {
  user: User | null
  currentPath: string
  children: ComponentChildren
}

export default function PanelLayout({ user: initialUser, currentPath, children }: PanelLayoutProps) {
  const open = useSignal(false)
  // Use Signals store user if available, otherwise use initial user
  const user = useSignal<User | null>(userSignal.value || initialUser)
  const isLoading = useSignal(false)
  const requiresSetup = useComputed(() => Boolean(user.value && (!user.value.mfaEnabled || user.value.mfaPending)))

  // Update local user when Signals store changes
  useEffect(() => {
    const unsubscribe = () => {
      // Track changes to userSignal
      const currentUser = userSignal.value
      if (currentUser) {
        user.value = currentUser
      }
    }
    // Immediately sync with Signals store
    unsubscribe()

    // Listen for login-success event to refresh user
    const handleLoginSuccess = async () => {
      isLoading.value = true
      try {
        const refreshedUser = await fetchSessionUser()
        user.value = refreshedUser
        // Also update the Signals store
        if (refreshedUser) {
          // Note: We're setting local state, the Signals store will be updated by UserProvider
        }
      } catch (error) {
        console.warn('Failed to refresh user after login', error)
      } finally {
        isLoading.value = false
      }
    }

    // Listen for login-success event
    if (typeof window !== 'undefined') {
      window.addEventListener('login-success', handleLoginSuccess)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('login-success', handleLoginSuccess)
      }
    }
  }, [])

  // Refresh user session periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const refreshedUser = await fetchSessionUser()
        user.value = refreshedUser
      } catch (error) {
        console.warn('Failed to refresh user session', error)
      }
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    isLoading.value = true
    try {
      await logoutUser()
      globalThis.location.href = '/login'
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      isLoading.value = false
    }
  }

  const mfaMessages = {
    lockedMessage: '您的账户需要设置双因素认证（MFA）后才能访问其他功能。请前往账户设置完成配置。',
    setupAction: '前往设置',
    docsAction: '查看文档',
    logoutAction: '退出登录',
    docsUrl: '/docs/security/mfa',
  }

  return (
    <div class="relative flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900">
      <Sidebar
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          open.value ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        onNavigate={() => (open.value = false)}
        user={user.value}
        currentPath={currentPath}
      />

      {open.value && (
        <div
          class="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm md:hidden"
          onClick={() => (open.value = false)}
        />
      )}

      <div class="flex min-h-screen flex-1 flex-col">
        <Header
          onMenu={() => (open.value = !open.value)}
          user={user.value}
          isLoading={isLoading.value}
        />
        <main class="flex flex-1 flex-col space-y-6 bg-transparent px-3 py-5 text-slate-900 transition-colors sm:px-4 md:px-6 lg:px-8">
          {requiresSetup.value && currentPath !== '/panel/account' ? (
            <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 transition-colors">
              <p class="text-sm">{mfaMessages.lockedMessage}</p>
              <div class="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => (globalThis.location.href = '/panel/account?setupMfa=1')}
                  class="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
                >
                  {mfaMessages.setupAction}
                </button>
                <a
                  href={mfaMessages.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  class="inline-flex items-center justify-center rounded-md border border-sky-300 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:border-sky-500 hover:bg-sky-50"
                >
                  {mfaMessages.docsAction}
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  class="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
                >
                  {mfaMessages.logoutAction}
                </button>
                {isLoading.value && (
                  <span class="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                    …
                  </span>
                )}
              </div>
            </div>
          ) : null}
          <div class="flex w-full flex-1 flex-col gap-5 text-slate-900 transition-colors md:gap-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
