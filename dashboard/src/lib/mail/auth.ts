'use client'

import { useMemo } from 'react'

import { useUserStore } from '@lib/userStore'

export function useTenantAuthContext() {
  const user = useUserStore((state) => state.user)

  return useMemo(() => {
    const memberships = user?.tenants ?? []
    const defaultTenant =
      memberships.find((tenant) => tenant.id === user?.tenantId) ?? memberships[0] ?? (user?.tenantId ? { id: user.tenantId } : null)

    return {
      user,
      defaultTenantId: defaultTenant?.id,
      tenants: memberships,
    }
  }, [user])
}

export function buildTenantHeaders(tenantId: string, token?: string) {
  const headers: Record<string, string> = {
    'x-tenant-id': tenantId,
  }
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  }
  return headers
}
