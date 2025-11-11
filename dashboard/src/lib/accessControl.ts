import { useMemo } from 'react'

import { useUser } from './userStore'
import type { SessionUser, TenantMembership, UserRole } from './userStore'

type AccessReason = 'unauthenticated' | 'forbidden'

export type AccessDecision = {
  allowed: boolean
  reason?: AccessReason
  userRole: UserRole
  userTenants?: TenantMembership[]
  tenantId?: string
}

export type AccessRule = {
  requireLogin?: boolean
  allowGuests?: boolean
  roles?: UserRole[]
  permissions?: string[]
}

const EVERYONE_ROLES: UserRole[] = ['guest', 'user', 'operator', 'admin']

function normalizeRoles(roles?: UserRole[]): UserRole[] | undefined {
  if (!roles || roles.length === 0) {
    return undefined
  }
  const known = new Set<UserRole>()
  for (const role of roles) {
    if (EVERYONE_ROLES.includes(role)) {
      known.add(role)
    }
  }
  return known.size ? Array.from(known) : undefined
}

function normalizePermissions(permissions?: string[]): string[] | undefined {
  if (!permissions || permissions.length === 0) {
    return undefined
  }
  const known = new Set<string>()
  for (const permission of permissions) {
    const trimmed = permission.trim()
    if (trimmed.length > 0) {
      known.add(trimmed)
    }
  }
  return known.size ? Array.from(known) : undefined
}

export function resolveAccess(user: SessionUser, rule?: AccessRule): AccessDecision {
  const normalizedRule = rule ?? {}
  const normalizedRoles = normalizeRoles(normalizedRule.roles)
  const normalizedPermissions = normalizePermissions(normalizedRule.permissions)

  const role: UserRole = user?.role ?? 'guest'
  const isAuthenticated = Boolean(user)
  const allowGuests =
    normalizedRule.allowGuests ?? (!normalizedRoles || normalizedRoles.includes('guest'))
  const requiresLogin =
    normalizedRule.requireLogin ??
    (!allowGuests ||
      Boolean(normalizedPermissions && normalizedPermissions.length > 0) ||
      Boolean(normalizedRoles && !normalizedRoles.includes('guest')))

  if (!isAuthenticated && requiresLogin) {
    if (allowGuests) {
      // Guests explicitly allowed to pass through.
    } else {
      return { allowed: false, reason: 'unauthenticated', userRole: role }
    }
  }

  if (normalizedRoles && !normalizedRoles.includes(role)) {
    if (!isAuthenticated && allowGuests) {
      return { allowed: false, reason: 'unauthenticated', userRole: role }
    }
    return { allowed: false, reason: isAuthenticated ? 'forbidden' : 'unauthenticated', userRole: role }
  }

  if (normalizedPermissions && normalizedPermissions.length > 0) {
    const userPermissions = new Set(user?.permissions ?? [])
    const missing = normalizedPermissions.some((permission) => !userPermissions.has(permission))
    if (missing) {
      return { allowed: false, reason: isAuthenticated ? 'forbidden' : 'unauthenticated', userRole: role }
    }
  }

  return {
    allowed: true,
    userRole: role,
    userTenants: user?.tenants,
    tenantId: user?.tenantId,
  }
}

export function useAccess(rule?: AccessRule) {
  const { user, isLoading } = useUser()

  const decision = useMemo(() => resolveAccess(user, rule), [user, rule])

  return {
    ...decision,
    isLoading,
  }
}
