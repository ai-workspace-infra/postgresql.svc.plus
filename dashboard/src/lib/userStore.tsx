'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import useSWR from 'swr'
import { create } from 'zustand'

export type UserRole = 'guest' | 'user' | 'operator' | 'admin'

export type TenantMembership = {
  id: string
  name?: string
  role?: UserRole
}

type User = {
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

type UserContextValue = {
  user: User | null
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

type UserStore = {
  user: User | null
  setUser: (user: User | null) => void
}

const sessionStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

const UserContext = createContext<UserContextValue | undefined>(undefined)

const SESSION_CACHE_KEY = 'account_session'

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

async function fetchSessionUser(): Promise<User | null> {
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
      user?: {
        id?: string
        uuid?: string
        email: string
        name?: string
        username?: string
        mfaEnabled?: boolean
        mfaPending?: boolean
        role?: string
        groups?: string[]
        permissions?: string[]
        tenantId?: string
        tenants?: TenantMembership[]
        mfa?: {
          totpEnabled?: boolean
          totpPending?: boolean
          totpSecretIssuedAt?: string
          totpConfirmedAt?: string
          totpLockedUntil?: string
        }
      } | null
    }

    const sessionUser = payload?.user
    if (!sessionUser) {
      return null
    }

    const { id, uuid, email, name, username, mfaEnabled, mfa, mfaPending, role, groups, permissions } = sessionUser
    const identifier =
      typeof uuid === 'string' && uuid.trim().length > 0
        ? uuid.trim()
        : typeof id === 'string'
          ? id.trim()
          : ''

    if (!identifier) {
      return null
    }
    const normalizedName = typeof name === 'string' && name.trim().length > 0 ? name.trim() : undefined
    const normalizedUsername =
      typeof username === 'string' && username.trim().length > 0 ? username.trim() : normalizedName

    const normalizedMfa = mfa
      ? {
          ...mfa,
          totpEnabled: Boolean(mfa.totpEnabled ?? mfaEnabled),
          totpPending: Boolean(mfa.totpPending ?? mfaPending) && !Boolean(mfa.totpEnabled ?? mfaEnabled),
        }
      : {
          totpEnabled: Boolean(mfaEnabled),
          totpPending: Boolean(mfaPending) && !Boolean(mfaEnabled),
        }

    const normalizedRole = normalizeRole(role)
    const normalizedGroups = Array.isArray(groups)
      ? groups
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          .map((value) => value.trim())
      : []
    const normalizedPermissions = Array.isArray(permissions)
      ? permissions
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          .map((value) => value.trim())
      : []
    const normalizedTenantId =
      typeof sessionUser.tenantId === 'string' && sessionUser.tenantId.trim().length > 0
        ? sessionUser.tenantId.trim()
        : undefined
    const normalizedTenants = Array.isArray(sessionUser.tenants)
      ? sessionUser.tenants
          .map((tenant) => {
            if (!tenant || typeof tenant !== 'object') {
              return null
            }
            const identifier =
              typeof tenant.id === 'string' && tenant.id.trim().length > 0
                ? tenant.id.trim()
                : undefined
            if (!identifier) {
              return null
            }

            const normalizedTenant: TenantMembership = {
              id: identifier,
            }

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

    return {
      id: identifier,
      uuid: identifier,
      email,
      name: normalizedName,
      username: normalizedUsername ?? email,
      mfaEnabled: Boolean(mfaEnabled ?? mfa?.totpEnabled),
      mfaPending: Boolean(mfaPending ?? mfa?.totpPending) && !Boolean(mfaEnabled ?? mfa?.totpEnabled),
      mfa: normalizedMfa,
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
  } catch (error) {
    console.warn('Failed to resolve user session', error)
    return null
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const user = sessionStore((state) => state.user)
  const setUser = sessionStore((state) => state.setUser)

  const {
    data,
    isLoading,
    mutate,
  } = useSWR<User | null>(SESSION_CACHE_KEY, fetchSessionUser, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
    shouldRetryOnError: true,
  })

  useEffect(() => {
    if (data === undefined) {
      return
    }
    setUser(data)
  }, [data, setUser])

  const refresh = useCallback(async () => {
    const nextUser = await mutate()
    setUser(nextUser ?? null)
  }, [mutate, setUser])

  const login = useCallback(async () => {
    await refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch (error) {
      console.warn('Failed to clear user session', error)
    }

    await refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refresh,
    }),
    [user, isLoading, login, logout, refresh],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}
