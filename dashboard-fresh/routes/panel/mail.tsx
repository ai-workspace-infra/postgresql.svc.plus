/**
 * Panel Mail Page - Fresh + Deno
 *
 * Mail service management page (simplified version)
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

interface MailPageData {
  user: User | null
  pathname: string
}

export const handler: Handlers<MailPageData, FreshState> = {
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

export default function MailPage({ data }: PageProps<MailPageData>) {
  const { user, pathname } = data

  return (
    <>
      <Head>
        <title>Mail Service - CloudNative Suite</title>
        <meta name="description" content="Multi-tenant mail service management" />
        <link rel="stylesheet" href="/styles/globals.css" />
      </Head>

      <PanelLayout user={user} currentPath={pathname}>
        <div class="space-y-6">
          {/* Header */}
          <div class="space-y-2">
            <h1 class="text-3xl font-bold text-slate-900">Mail Service</h1>
            <p class="text-slate-600">多租户邮箱统一收件、AI 摘要与智能回复</p>
          </div>

          {/* Feature Overview Card */}
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">功能概览</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100">
                  <svg class="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900">统一收件箱</h3>
                  <p class="mt-1 text-sm text-slate-600">管理多个租户的邮件账户，集中查看所有邮件</p>
                </div>
              </div>

              <div class="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900">AI 智能摘要</h3>
                  <p class="mt-1 text-sm text-slate-600">自动生成邮件摘要，快速了解邮件内容</p>
                </div>
              </div>

              <div class="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <svg class="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900">智能回复建议</h3>
                  <p class="mt-1 text-sm text-slate-600">AI 生成回复建议，提高邮件处理效率</p>
                </div>
              </div>

              <div class="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <svg class="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900">智能分类</h3>
                  <p class="mt-1 text-sm text-slate-600">自动标签和分类，轻松管理邮件</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Notice */}
          <div class="rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-6">
            <div class="flex items-start gap-4">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-100">
                <svg class="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-sky-900">功能开发中</h3>
                <p class="mt-1 text-sm text-sky-700">
                  邮件中心功能正在积极开发中。完整的邮件管理界面将包括：
                </p>
                <ul class="mt-2 space-y-1 text-sm text-sky-700">
                  <li>• 租户邮箱配置与管理</li>
                  <li>• 邮件收发与线程视图</li>
                  <li>• AI 驱动的邮件摘要与回复建议</li>
                  <li>• 智能标签与分类系统</li>
                  <li>• 搜索与过滤功能</li>
                </ul>
                <p class="mt-3 text-sm text-sky-700">
                  如需了解更多信息，请查阅{' '}
                  <a href="/docs" class="font-semibold underline hover:text-sky-900">
                    技术文档
                  </a>
                  。
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">快速操作</h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <button
                class="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-sky-300 hover:bg-sky-50"
                disabled
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-slate-400">添加邮箱账户</p>
                  <p class="text-sm text-slate-400">即将推出</p>
                </div>
              </button>

              <button
                class="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-sky-300 hover:bg-sky-50"
                disabled
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-slate-400">配置 AI 功能</p>
                  <p class="text-sm text-slate-400">即将推出</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </PanelLayout>
    </>
  )
}
