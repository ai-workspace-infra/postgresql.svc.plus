'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Card from '../components/Card'
import TrendChart, { type MetricsSeries } from '../management/components/TrendChart'
import OverviewCards, { type MetricsOverview } from '../management/components/OverviewCards'
import PermissionMatrixEditor, {
  type PermissionMatrix,
} from '../management/components/PermissionMatrixEditor'
import UserGroupManagement, { type ManagedUser } from '../management/components/UserGroupManagement'
import { resolveAccess } from '@lib/accessControl'
import { useUser } from '@lib/userStore'

type UserMetricsResponse = {
  overview: MetricsOverview
  series: MetricsSeries
}

type AdminSettingsResponse = {
  version: number
  matrix: PermissionMatrix
}

type ApiError = {
  error?: string
  message?: string
  matrix?: PermissionMatrix
  version?: number
}

async function jsonFetcher<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init?.headers),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    let payload: ApiError | undefined
    try {
      payload = (await response.json()) as ApiError
    } catch (error) {
      // Ignore JSON parse errors; fall back to status text below.
    }
    const message = payload?.error ?? payload?.message ?? response.statusText
    throw new Error(message || '请求失败')
  }

  return (await response.json()) as T
}

export default function UserCenterManagementRoute() {
  const { user, isLoading: isUserLoading } = useUser()
  const accessDecision = useMemo(() => resolveAccess(user, { requireLogin: true, roles: ['admin', 'operator'] }), [user])
  const canAccess = accessDecision.allowed
  const canEditPermissions = Boolean(user?.isAdmin)
  const canEditRoles = Boolean(user?.isAdmin)

  const [matrixDraft, setMatrixDraft] = useState<PermissionMatrix>({})
  const [matrixVersion, setMatrixVersion] = useState<number>(0)
  const [matrixDirty, setMatrixDirty] = useState(false)
  const [matrixSaving, setMatrixSaving] = useState(false)
  const [matrixStatus, setMatrixStatus] = useState<string | undefined>()
  const [matrixError, setMatrixError] = useState<string | undefined>()
  const [roleUpdateMessage, setRoleUpdateMessage] = useState<string | undefined>()
  const [pendingRoleUpdates, setPendingRoleUpdates] = useState<Set<string>>(new Set())

  const metricsSWR = useSWR<UserMetricsResponse>(canAccess ? '/api/admin/users/metrics' : null, jsonFetcher, {
    revalidateOnFocus: false,
  })
  const settingsSWR = useSWR<AdminSettingsResponse>(canAccess ? '/api/admin/settings' : null, jsonFetcher, {
    revalidateOnFocus: false,
  })
  const usersSWR = useSWR<ManagedUser[]>(canAccess ? '/api/users' : null, jsonFetcher, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (settingsSWR.data?.matrix) {
      setMatrixDraft(settingsSWR.data.matrix)
      setMatrixVersion(settingsSWR.data.version)
      setMatrixDirty(false)
      setMatrixError(undefined)
    }
  }, [settingsSWR.data])

  const lastUpdatedLabel = useMemo(() => {
    if (!metricsSWR.data) {
      return undefined
    }
    const now = new Date()
    return `更新于 ${now.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }, [metricsSWR.data])

  const handleTogglePermission = useCallback(
    (moduleKey: string, role: string, nextValue: boolean) => {
      setMatrixDraft((prev) => {
        const next: PermissionMatrix = { ...prev }
        const normalizedModuleKey = moduleKey.trim()
        const normalizedRole = role.trim()
        const currentRoleMap = next[normalizedModuleKey] ?? {}
        next[normalizedModuleKey] = { ...currentRoleMap, [normalizedRole]: nextValue }
        return next
      })
      setMatrixDirty(true)
      setMatrixStatus(undefined)
      setMatrixError(undefined)
    },
    [],
  )

  const handleSaveMatrix = useCallback(async () => {
    if (!canEditPermissions || !matrixDirty) {
      return
    }
    setMatrixSaving(true)
    setMatrixStatus(undefined)
    setMatrixError(undefined)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: matrixVersion,
          matrix: matrixDraft,
        }),
      })

      if (response.ok) {
        const payload = (await response.json()) as AdminSettingsResponse
        setMatrixDraft(payload.matrix)
        setMatrixVersion(payload.version)
        setMatrixDirty(false)
        setMatrixStatus('已保存')
        settingsSWR.mutate(payload, { revalidate: false })
        return
      }

      let payload: ApiError | undefined
      try {
        payload = (await response.json()) as ApiError
      } catch (error) {
        // ignore parsing error
      }

      if (response.status === 409 && payload?.matrix) {
        setMatrixDraft(payload.matrix)
        if (typeof payload.version === 'number') {
          setMatrixVersion(payload.version)
        }
        setMatrixDirty(false)
        setMatrixError(payload.message ?? '配置已被其他人更新，已同步最新版本')
        return
      }

      const message = payload?.error ?? payload?.message ?? '保存失败'
      throw new Error(message)
    } catch (error) {
      setMatrixError(error instanceof Error ? error.message : '保存失败')
    } finally {
      setMatrixSaving(false)
    }
  }, [canEditPermissions, matrixDirty, matrixDraft, matrixVersion, settingsSWR])

  const markRolePending = useCallback((userId: string, pending: boolean) => {
    setPendingRoleUpdates((prev) => {
      const next = new Set(prev)
      if (pending) {
        next.add(userId)
      } else {
        next.delete(userId)
      }
      return next
    })
  }, [])

  const handleRoleChange = useCallback(
    async (userId: string, role: string) => {
      if (!canEditRoles) {
        return
      }
      setRoleUpdateMessage(undefined)
      markRolePending(userId, true)
      try {
        await jsonFetcher(`/api/admin/users/${userId}/role`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        })
        setRoleUpdateMessage('角色已更新')
        usersSWR.mutate()
      } catch (error) {
        setRoleUpdateMessage(error instanceof Error ? error.message : '更新失败')
      } finally {
        markRolePending(userId, false)
      }
    },
    [canEditRoles, markRolePending, usersSWR],
  )

  const handleRoleReset = useCallback(
    async (userId: string) => {
      if (!canEditRoles) {
        return
      }
      setRoleUpdateMessage(undefined)
      markRolePending(userId, true)
      try {
        await jsonFetcher(`/api/admin/users/${userId}/role`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
        setRoleUpdateMessage('角色已重置')
        usersSWR.mutate()
      } catch (error) {
        setRoleUpdateMessage(error instanceof Error ? error.message : '更新失败')
      } finally {
        markRolePending(userId, false)
      }
    },
    [canEditRoles, markRolePending, usersSWR],
  )

  const matrixPending = matrixSaving || isUserLoading
  const metricsLoading = metricsSWR.isLoading
  const settingsLoading = settingsSWR.isLoading
  const usersLoading = usersSWR.isLoading

  if (!canAccess) {
    return (
      <Card>
        <h1 className="text-2xl font-semibold text-gray-900">权限不足</h1>
        <p className="mt-2 text-sm text-gray-600">需要管理员或运维角色才能访问此页面。</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <OverviewCards overview={metricsSWR.data?.overview} isLoading={metricsLoading} lastUpdatedLabel={lastUpdatedLabel} />
      <TrendChart series={metricsSWR.data?.series} isLoading={metricsLoading} />
      <PermissionMatrixEditor
        matrix={matrixDraft}
        roles={['user', 'admin', 'operator']}
        isLoading={settingsLoading}
        isSaving={matrixPending}
        hasChanges={matrixDirty}
        statusMessage={matrixStatus}
        errorMessage={matrixError}
        onToggle={handleTogglePermission}
        onSave={handleSaveMatrix}
        canEdit={canEditPermissions}
      />
      <UserGroupManagement
        users={usersSWR.data}
        isLoading={usersLoading}
        onRoleChange={handleRoleChange}
        onRoleReset={handleRoleReset}
        canEditRoles={canEditRoles}
        pendingUserIds={pendingRoleUpdates}
        message={roleUpdateMessage}
      />
    </div>
  )
}
