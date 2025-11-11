'use client'

import { useMemo } from 'react'
import Card from '../../components/Card'

export type ManagedUser = {
  id: string
  email: string
  role?: string
  groups?: string[]
  active?: boolean
  created_at?: string
}

type UserGroupManagementProps = {
  users?: ManagedUser[]
  isLoading?: boolean
  pendingUserIds?: Set<string>
  canEditRoles: boolean
  onRoleChange?: (userId: string, role: string) => void
  onInvite?: () => void
  onImport?: () => void
}

const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'operator', label: '运营者' },
  { value: 'user', label: '用户' },
]

export function UserGroupManagement({
  users,
  isLoading = false,
  pendingUserIds,
  canEditRoles,
  onRoleChange,
  onInvite,
  onImport,
}: UserGroupManagementProps) {
  const data = useMemo(() => users ?? [], [users])
  const pendingSet = pendingUserIds ?? new Set<string>()

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">用户组</h2>
            <p className="text-sm text-gray-500">查看当前成员并调整角色或发起邀请</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onInvite}
              className="inline-flex items-center rounded-full border border-purple-200 px-4 py-2 text-sm font-medium text-purple-600 transition hover:border-purple-300 hover:bg-purple-50"
            >
              批量邀请
            </button>
            <button
              type="button"
              onClick={onImport}
              className="inline-flex items-center rounded-full border border-purple-200 px-4 py-2 text-sm font-medium text-purple-600 transition hover:border-purple-300 hover:bg-purple-50"
            >
              批量导入
            </button>
          </div>
        </header>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">邮箱</th>
                <th className="px-4 py-2 font-medium">角色</th>
                <th className="px-4 py-2 font-medium">用户组</th>
                <th className="px-4 py-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white/80">
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-4 py-3">
                        <span className="inline-block h-4 w-48 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block h-4 w-24 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block h-4 w-32 rounded bg-gray-200" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block h-4 w-16 rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                : data.map((user) => {
                    const role = user.role ?? 'user'
                    const isPending = pendingSet.has(user.id)
                    return (
                      <tr key={user.id} className="transition hover:bg-purple-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.email}</td>
                        <td className="px-4 py-3">
                          <select
                            className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            value={role}
                            disabled={!canEditRoles || isPending}
                            onChange={(event) => onRoleChange?.(user.id, event.target.value)}
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {isPending ? <p className="mt-1 text-xs text-purple-500">更新中…</p> : null}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{user.groups?.join('、') || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {user.active ? '活跃' : '未激活'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
          {!isLoading && data.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">暂无用户数据</div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

export default UserGroupManagement
