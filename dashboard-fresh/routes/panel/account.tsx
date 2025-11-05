/**
 * Panel Account Page - Fresh + Deno
 *
 * User account settings page
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

interface AccountPageData {
  user: User | null
  pathname: string
  setupMfa: boolean
}

export const handler: Handlers<AccountPageData, FreshState> = {
  async GET(req, ctx) {
    const accountUser = ctx.state.user

    // If middleware passed through, user is authenticated
    const user = adaptUser(accountUser)
    const url = new URL(req.url)
    const setupMfa = url.searchParams.get('setupMfa') === '1'

    return ctx.render({
      user,
      pathname: url.pathname,
      setupMfa,
    })
  },
}

export default function AccountPage({ data }: PageProps<AccountPageData>) {
  const { user, pathname, setupMfa } = data

  return (
    <>
      <Head>
        <title>Account Settings - CloudNative Suite</title>
        <meta name="description" content="Manage your account settings" />
        <link rel="stylesheet" href="/styles/globals.css" />
      </Head>

      <PanelLayout user={user} currentPath={pathname}>
        <div class="space-y-6">
          <div class="space-y-2">
            <h1 class="text-3xl font-bold text-slate-900">Account Settings</h1>
            <p class="text-slate-600">Manage your account information and security settings</p>
          </div>

          {setupMfa && (
            <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <p class="font-semibold">⚠️ MFA Setup Required</p>
              <p class="mt-1 text-sm">You need to set up two-factor authentication to access all features.</p>
            </div>
          )}

          {/* Account Information */}
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">Account Information</h2>
            <div class="space-y-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="text-sm font-medium text-slate-600">User ID</label>
                  <p class="mt-1 font-mono text-sm text-slate-900">{user?.uuid}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600">Role</label>
                  <p class="mt-1 text-sm text-slate-900">{user?.role}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600">Email</label>
                  <p class="mt-1 text-sm text-slate-900">{user?.email}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-600">Username</label>
                  <p class="mt-1 text-sm text-slate-900">{user?.username}</p>
                </div>
                {user?.name && (
                  <div>
                    <label class="text-sm font-medium text-slate-600">Display Name</label>
                    <p class="mt-1 text-sm text-slate-900">{user.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">Security Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p class="font-semibold text-slate-900">Two-Factor Authentication (MFA)</p>
                  <p class="text-sm text-slate-600">
                    {user?.mfaEnabled
                      ? 'MFA is enabled and protecting your account'
                      : user?.mfaPending
                        ? 'MFA setup is pending completion'
                        : 'Enable MFA for enhanced security'}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  {user?.mfaEnabled ? (
                    <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Enabled
                    </span>
                  ) : user?.mfaPending ? (
                    <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                  ) : (
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              {!user?.mfaEnabled && (
                <div class="rounded-xl border border-dashed border-sky-200 bg-sky-50 p-4">
                  <p class="text-sm text-sky-800">
                    <strong>Note:</strong> MFA setup functionality will be available in the next update. This page
                    currently displays your current security status.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          {user?.permissions && user.permissions.length > 0 && (
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-xl font-semibold text-slate-900">Permissions</h2>
              <div class="flex flex-wrap gap-2">
                {user.permissions.map((permission) => (
                  <span
                    key={permission}
                    class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          {user?.groups && user.groups.length > 0 && (
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-xl font-semibold text-slate-900">Groups</h2>
              <div class="flex flex-wrap gap-2">
                {user.groups.map((group) => (
                  <span
                    key={group}
                    class="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </PanelLayout>
    </>
  )
}
