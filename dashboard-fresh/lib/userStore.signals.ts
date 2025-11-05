/**
 * User Store - Signals Implementation (Deno + Fresh)
 *
 * Migration from: Zustand + React Context + SWR
 * Migration to: Preact Signals + Context
 */

import { createContext } from 'preact'
import { useContext, useEffect } from 'preact/hooks'
import { signal, computed, effect } from '@preact/signals'
import type { User as MiddlewareUser } from '@/middleware.ts'

// ========== Types ==========

export type UserRole = 'guest' | 'user' | 'operator' | 'admin'

export type TenantMembership = {
  id: string
  name?: string
  role?: UserRole
}

export type User = {
  id: string
  uuid: string
  email: string
  name?: string
  username: string
  mfaEnabled: boolean
  mfaPending: boolean
  role: UserRole
  groups: string[]
  permissions: string[]
  isGuest: boolean
  isUser: boolean
  isOperator: boolean
  isAdmin: boolean
  tenantId?: string
  tenants?: TenantMembership[]
  mfa?: {
    totpEnabled?: boolean
    totpPending?: boolean
    totpSecretIssuedAt?: string
    totpConfirmedAt?: string
    totpLockedUntil?: string
  }
}

export type SessionUser = User | null

// ========== Internal State ==========

const SESSION_CACHE_KEY = 'account_session'

// Raw signals - hold raw data from middleware
const _userSignal = signal<MiddlewareUser | null>(null)
const _isLoadingSignal = signal<boolean>(true)

// Public computed signals - derive normalized user data
const user = computed(() => {
  const rawUser = _userSignal.value
  if (!rawUser) return null

  const normalizedRole = normalizeRole(rawUser.role)
  const normalizedMfa = rawUser.mfa ?? {}
  const derivedMfaEnabled = Boolean(rawUser.mfaEnabled ?? normalizedMfa.totpEnabled)
  const derivedMfaPendingSource =
    typeof rawUser.mfaPending === 'boolean'
      ? rawUser.mfaPending
      : typeof normalizedMfa.totpPending === 'boolean'
        ? normalizedMfa.totpPending
        : false
  const derivedMfaPending = derivedMfaPendingSource && !derivedMfaEnabled

  const normalizedGroups = Array.isArray(rawUser.groups)
    ? rawUser.groups
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    : []

  const normalizedPermissions = Array.isArray(rawUser.permissions)
    ? rawUser.permissions
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    : []

  const normalizedTenantId =
    typeof rawUser.tenantId === 'string' && rawUser.tenantId.trim().length > 0
      ? rawUser.tenantId.trim()
      : undefined

  const normalizedTenants = Array.isArray(rawUser.tenants)
    ? rawUser.tenants
        .map((tenant) => {
          if (!tenant || typeof tenant !== 'object') {
            return null
          }

          const id =
            typeof tenant.id === 'string' && tenant.id.trim().length > 0
              ? tenant.id.trim()
              : undefined
          if (!id) {
            return null
          }

          const normalizedTenant: TenantMembership = { id }

          if (typeof tenant.name === 'string' && tenant.name.trim().length > 0) {
            normalizedTenant.name = tenant.name.trim()
          }

          if (typeof tenant.role === 'string' && tenant.role.trim().length > 0) {
            normalizedTenant.role = normalizeRole(tenant.role)
          }

          return normalizedTenant
        })
        .filter((tenant): tenant is TenantMembership => Boolean(tenant))
    : undefined

  const identifier =
    typeof rawUser.uuid === 'string' && rawUser.uuid.trim().length > 0
      ? rawUser.uuid.trim()
      : typeof rawUser.id === 'string'
        ? rawUser.id.trim()
        : undefined

  const normalizedMfaData = Object.keys(normalizedMfa).length
    ? {
        ...normalizedMfa,
        totpEnabled: Boolean(normalizedMfa.totpEnabled ?? derivedMfaEnabled),
        totpPending: Boolean(normalizedMfa.totpPending ?? derivedMfaPending),
      }
    : {
        totpEnabled: derivedMfaEnabled,
        totpPending: derivedMfaPending,
      }

  return {
    id: identifier || '',
    uuid: identifier || '',
    email: rawUser.email,
    name: rawUser.name,
    username: rawUser.username || rawUser.name || rawUser.email,
    mfaEnabled: derivedMfaEnabled,
    mfaPending: derivedMfaPending,
    mfa: normalizedMfaData,
    role: normalizedRole,
    groups: normalizedGroups,
    permissions: normalizedPermissions,
    isGuest: normalizedRole === 'guest',
    isUser: normalizedRole === 'user',
    isOperator: normalizedRole === 'operator',
    isAdmin: normalizedRole === 'admin',
    tenantId: normalizedTenantId,
    tenants: normalizedTenants,
  }
})

const isLoading = computed(() => _isLoadingSignal.value)

// ========== Actions ==========

async function fetchSessionUser(): Promise<MiddlewareUser | null> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as {
      user?: MiddlewareUser | null
    }

    return payload?.user ?? null
  } catch (error) {
    console.warn('Failed to resolve user session', error)
    return null
  }
}

async function refresh(): Promise<void> {
  _isLoadingSignal.value = true
  try {
    const sessionUser = await fetchSessionUser()
    _userSignal.value = sessionUser
  } finally {
    _isLoadingSignal.value = false
  }
}

async function login(): Promise<void> {
  await refresh()
}

async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    })
  } catch (error) {
    console.warn('Failed to clear user session', error)
  }
  await refresh()
}

// ========== Helper Functions ==========

const KNOWN_ROLE_MAP: Record<string, UserRole> = {
  admin: 'admin',
  administrator: 'admin',
  operator: 'operator',
  ops: 'operator',
  user: 'user',
  member: 'user',
}

function normalizeRole(input?: string | null): UserRole {
  if (!input || typeof input !== 'string') {
    return 'guest'
  }

  const normalized = input.trim().toLowerCase()
  if (!normalized) {
    return 'guest'
  }

  return KNOWN_ROLE_MAP[normalized] ?? 'guest'
}

// ========== Context Provider ==========

type UserContextValue = {
  user: SessionUser
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: preact.VNode[] | preact.VNode }) {
  // Auto-refresh on mount
  useEffect(() => {
    refresh()
  }, [])

  const value: UserContextValue = {
    user: user.value,
    isLoading: isLoading.value,
    login,
    logout,
    refresh,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// ========== Selective Exports (for testing/migration) ==========

// Export raw signals for direct access if needed (advanced usage)
export { _userSignal, _isLoadingSignal }

// Export actions for direct use
export { refresh, login, logout }
