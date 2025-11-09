/**
 * Panel Index Page - Fresh + Deno
 *
 * Main dashboard page for the user panel
 */

import { Head } from '$fresh/runtime.ts'
import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import PanelLayout from '@/islands/panel/PanelLayout.tsx'
import type { User } from '@/lib/userSession.ts'

// Helper to adapt AccountUser from middleware to User type with computed properties
function adaptUser(accountUser: any): User | null {
  if (!accountUser) return null

  const normalizedRole = (accountUser.role?.toLowerCase() || 'guest') as User['role']

  return {
    ...accountUser,
    role: normalizedRole,
    isGuest: normalizedRole === 'guest',
    isUser: normalizedRole === 'user',
    isOperator: normalizedRole === 'operator',
    isAdmin: normalizedRole === 'admin',
  }
}

interface PanelPageData {
  user: User | null
  pathname: string
}

export const handler: Handlers<PanelPageData, FreshState> = {
  async GET(req, ctx) {
    const accountUser = ctx.state.user

    // If middleware passed through, user is authenticated
    const user = adaptUser(accountUser)

    return ctx.render({
      user,
      pathname: new URL(req.url).pathname,
    })
  },
}

export default function PanelPage({ data }: PageProps<PanelPageData>) {
  const { user, pathname } = data

  return (
    <>
      <Head>
        <title>Dashboard - Cloud-Neutral</title>
        <meta name="description" content="User Control Panel" />
        <link rel="stylesheet" href="/styles/globals.css" />
      </Head>

      <PanelLayout user={user} currentPath={pathname}>
        <div class="space-y-6">
          <div class="space-y-2">
            <h1 class="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p class="text-slate-600">Welcome to your control panel, {user?.name || user?.username || user?.email}</p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats */}
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-600">Account</p>
                  <p class="text-lg font-semibold text-slate-900">{user?.role}</p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-600">MFA Status</p>
                  <p class="text-lg font-semibold text-slate-900">
                    {user?.mfaEnabled ? 'Enabled' : user?.mfaPending ? 'Pending' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-600">Permissions</p>
                  <p class="text-lg font-semibold text-slate-900">{user?.permissions?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-slate-900">Quick Links</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <a
                href="/panel/account"
                class="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-sky-300 hover:shadow-md"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-sky-100 group-hover:text-sky-600">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-slate-900">Account Settings</p>
                  <p class="text-sm text-slate-600">Manage your account and security</p>
                </div>
              </a>

              <a
                href="/panel/api"
                class="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-sky-300 hover:shadow-md"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-sky-100 group-hover:text-sky-600">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-slate-900">API Keys</p>
                  <p class="text-sm text-slate-600">Manage your API credentials</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </PanelLayout>
    </>
  )
}
