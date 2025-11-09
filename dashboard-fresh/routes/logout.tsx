/**
 * Logout Page - Fresh + Deno
 *
 * User logout page with automatic redirect
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import { deleteCookie } from '$std/http/cookie.ts'

// Import Islands for client-side interactivity
import Navbar from '@/islands/Navbar.tsx'
import LogoutHandler from '@/islands/LogoutHandler.tsx'

interface LogoutPageData {
  language: 'zh' | 'en'
  user: { username?: string; email?: string } | null
}

export const handler: Handlers<LogoutPageData, FreshState> = {
  async GET(req, ctx) {
    const language = 'zh' // TODO: Get from cookie or state

    // Perform server-side logout
    const headers = new Headers()

    // Delete session cookie
    deleteCookie(headers, 'xc_session', {
      path: '/',
      domain: new URL(req.url).hostname,
    })

    // Delete auth token cookie if exists
    deleteCookie(headers, 'auth_token', {
      path: '/',
      domain: new URL(req.url).hostname,
    })

    return ctx.render({
      language,
      user: null,
    }, { headers })
  },
}

export default function LogoutPage({ data }: PageProps<LogoutPageData>) {
  const { language } = data

  const title = language === 'zh' ? '退出登录' : 'Logout'
  const signingOut = language === 'zh' ? '正在安全退出，请稍候…' : 'Signing you out safely. One moment…'

  return (
    <>
      <Head>
        <title>{title} - Cloud-Neutral</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Fixed Navbar */}
      <Navbar language={language} user={null} pathname="/logout" />

      {/* Main Content */}
      <main
        class="flex min-h-screen flex-col bg-gray-50"
        style="padding-top: var(--app-shell-nav-offset, 4rem)"
      >
        <div class="flex flex-1 items-center justify-center px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <div class="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-gray-100">
            {/* Spinning icon */}
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <svg
                aria-hidden="true"
                class="h-6 w-6 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>

            <h1 class="mt-6 text-2xl font-semibold text-gray-900">{title}</h1>
            <p class="mt-3 text-sm text-gray-600">{signingOut}</p>
          </div>
        </div>
      </main>

      {/* Client-side redirect handler */}
      <LogoutHandler />
    </>
  )
}
