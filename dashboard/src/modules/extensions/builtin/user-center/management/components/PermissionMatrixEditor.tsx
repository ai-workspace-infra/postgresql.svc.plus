'use client'

import Card from '../../components/Card'

export type PermissionMatrix = Record<string, Record<string, boolean>>

export type PermissionMatrixEditorProps = {
  matrix?: PermissionMatrix
  roles: string[]
  canEdit: boolean
  isLoading?: boolean
  isSaving?: boolean
  hasChanges?: boolean
  statusMessage?: string
  errorMessage?: string
  onToggle?: (moduleKey: string, role: string, nextValue: boolean) => void
  onSave?: () => void
}

export function PermissionMatrixEditor({
  matrix,
  roles,
  canEdit,
  isLoading = false,
  isSaving = false,
  hasChanges = false,
  statusMessage,
  errorMessage,
  onToggle,
  onSave,
}: PermissionMatrixEditorProps) {
  const moduleEntries = matrix ? Object.entries(matrix) : []
  const showEmptyState = !isLoading && moduleEntries.length === 0

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">权限矩阵</h2>
            <p className="text-sm text-gray-500">按角色管理各模块的访问控制</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{canEdit ? '管理员可编辑配置' : '只读视图'}</span>
            {isSaving ? <span className="text-purple-500">保存中…</span> : null}
            {statusMessage ? <span className="text-green-600">{statusMessage}</span> : null}
            {errorMessage ? <span className="text-red-500">{errorMessage}</span> : null}
          </div>
        </header>

        <div className="overflow-x-auto" aria-busy={isLoading} aria-live="polite">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-10 w-full animate-pulse rounded bg-gray-200/70" />
              ))}
            </div>
          ) : showEmptyState ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              暂无配置项，点击保存以初始化矩阵。
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">功能模块</th>
                  {roles.map((role) => (
                    <th key={role} className="px-4 py-2 text-left font-medium text-gray-600 capitalize">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/80">
                {moduleEntries.map(([moduleKey, roleMap]) => (
                  <tr key={moduleKey} className="transition hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-gray-700">{moduleKey}</td>
                    {roles.map((role) => {
                      const checked = Boolean(roleMap?.[role])
                      return (
                        <td key={`${moduleKey}-${role}`} className="px-4 py-3">
                          <label className={`inline-flex items-center gap-2 text-sm ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={checked}
                              disabled={!canEdit}
                              onChange={() => {
                                if (!onToggle) {
                                  return
                                }
                                onToggle(moduleKey, role, !checked)
                              }}
                            />
                            <span className="capitalize text-gray-600">{checked ? '启用' : '关闭'}</span>
                          </label>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {canEdit ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={!hasChanges || isSaving}
              className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition enabled:hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-purple-200"
            >
              保存{hasChanges && !isSaving ? '*' : ''}
            </button>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export default PermissionMatrixEditor
