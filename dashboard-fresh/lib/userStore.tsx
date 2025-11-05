/**
 * User Store - Signals Implementation (Deno + Fresh)
 *
 * Migration from: Zustand + React Context + SWR
 * Migration to: Preact Signals + Context
 */

import { createContext } from 'preact'
import { useContext, useEffect } from 'preact/hooks'
import { signal, computed } from '@preact/signals'
import type { AccountUser as MiddlewareUser } from '@/middleware.ts'
import { h } from 'preact'

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
        .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value: string) => value.trim())
    : []

  const normalizedPermissions = Array.isArray(rawUser.permissions)
    ? rawUser.permissions
        .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value: string) => value.trim())
    : []

  const normalizedTenantId =
    typeof rawUser.tenantId === 'string' && rawUser.tenantId.trim().length > 0
      ? rawUser.tenantId.trim()
      : undefined

  const normalizedTenants = Array.isArray(rawUser.tenants)
    ? rawUser.tenants
        .map((tenant: unknown) => {
          if (!tenant || typeof tenant !== 'object') {
            return null
          }

          const tenantObj = tenant as { id?: string; name?: string; role?: string }
          const id =
            typeof tenantObj.id === 'string' && tenantObj.id.trim().length > 0
              ? tenantObj.id.trim()
              : undefined
          if (!id) {
            return null
          }

          const normalizedTenant: TenantMembership = { id }

          if (typeof tenantObj.name === 'string' && tenantObj.name.trim().length > 0) {
            normalizedTenant.name = tenantObj.name.trim()
          }

          if (typeof tenantObj.role === 'string' && tenantObj.role.trim().length > 0) {
            normalizedTenant.role = normalizeRole(tenantObj.role)
          }

          return normalizedTenant
        })
        .filter((tenant: unknown): tenant is TenantMembership => Boolean(tenant))
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

  return h(UserContext.Provider, { value }, children)
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// ========== Mail Store (Shared) ==========

export interface MailState {
  tenantId: string | null
  selectedMessageId: string | null
  label: string | null
  search: string
  pageSize: number
  cursor: string | null
}

// Mail store signals
const mailTenantId = signal<string | null>(null)
const mailSelectedMessageId = signal<string | null>(null)
const mailLabel = signal<string | null>(null)
const mailSearch = signal<string>('')
const mailPageSize = signal<number>(25)
const mailCursor = signal<string | null>(null)

const DEFAULT_MAIL_STATE: Omit<MailState, keyof MailState> = {
  tenantId: null,
  selectedMessageId: null,
  label: null,
  search: '',
  pageSize: 25,
  cursor: null,
}

// Mail store actions
function setMailTenant(newTenantId: string): void {
  mailTenantId.value = newTenantId
  mailSelectedMessageId.value = null
  mailLabel.value = null
  mailCursor.value = null
}

function setMailSelectedMessageId(id: string | null): void {
  mailSelectedMessageId.value = id
}

function setMailLabel(newLabel: string | null): void {
  mailLabel.value = newLabel
  mailCursor.value = null
}

function setMailSearch(term: string): void {
  mailSearch.value = term
  mailCursor.value = null
}

function setMailCursor(newCursor: string | null): void {
  mailCursor.value = newCursor
}

function setMailPageSize(size: number): void {
  mailPageSize.value = size
  mailCursor.value = null
}

function resetMailStore(): void {
  mailTenantId.value = null
  mailSelectedMessageId.value = null
  mailLabel.value = null
  mailSearch.value = ''
  mailPageSize.value = 25
  mailCursor.value = null
}

// Mail store object - backward compatible with Zustand API
export const useMailStore = (selector?: (state: MailState) => any) => {
  const state: MailState = {
    tenantId: mailTenantId.value,
    selectedMessageId: mailSelectedMessageId.value,
    label: mailLabel.value,
    search: mailSearch.value,
    pageSize: mailPageSize.value,
    cursor: mailCursor.value,
  }

  if (selector) {
    return selector(state)
  }

  return {
    ...state,
    setTenant: setMailTenant,
    setSelectedMessageId: setMailSelectedMessageId,
    setLabel: setMailLabel,
    setSearch: setMailSearch,
    setCursor: setMailCursor,
    setPageSize: setMailPageSize,
    reset: resetMailStore,
  }
}

// Export individual mail store exports
export {
  // User signals
  user,
  isLoading,
  // Mail signals
  mailTenantId,
  mailSelectedMessageId,
  mailLabel,
  mailSearch,
  mailPageSize,
  mailCursor,
  setMailTenant as setTenant,
  setMailSelectedMessageId as setSelectedMessageId,
  setMailLabel as setLabel,
  setMailSearch as setSearch,
  setMailCursor as setCursor,
  setMailPageSize as setPageSize,
  resetMailStore as resetMailStore,
  resetMailStore as reset,
}
