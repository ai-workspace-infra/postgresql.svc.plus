/**
 * Session API Handler - Fresh + Deno
 *
 * GET /api/auth/session - Get current user session
 * DELETE /api/auth/session - Logout (clear session)
 */

import { Handlers } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  getSessionToken,
} from '@/lib/authGateway.deno.ts'
import { getAccountServiceApiBaseUrl } from '@/server/serviceConfig.deno.ts'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

interface AccountUser {
  id?: string
  uuid?: string
  name?: string
  username?: string
  email: string
  mfaEnabled?: boolean
  mfaPending?: boolean
  mfa?: {
    totpEnabled?: boolean
    totpPending?: boolean
    totpSecretIssuedAt?: string
    totpConfirmedAt?: string
    totpLockedUntil?: string
  }
  role?: string
  groups?: string[]
  permissions?: string[]
  tenantId?: string
  tenants?: Array<{
    id?: string
    name?: string
    role?: string
  }>
}

interface SessionResponse {
  user?: AccountUser | null
  error?: string
}

async function fetchSession(token: string) {
  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5000),
    })

    const data = (await response.json().catch(() => ({}))) as SessionResponse
    return { response, data }
  } catch (error) {
    console.error('Session lookup proxy failed', error)
    return { response: null, data: null }
  }
}

function normalizeUser(rawUser: AccountUser): AccountUser {
  const identifier =
    typeof rawUser.uuid === 'string' && rawUser.uuid.trim().length > 0
      ? rawUser.uuid.trim()
      : typeof rawUser.id === 'string'
        ? rawUser.id.trim()
        : undefined

  const rawMfa = rawUser.mfa ?? {}
  const derivedMfaEnabled = Boolean(rawUser.mfaEnabled ?? rawMfa.totpEnabled)
  const derivedMfaPendingSource =
    typeof rawUser.mfaPending === 'boolean'
      ? rawUser.mfaPending
      : typeof rawMfa.totpPending === 'boolean'
        ? rawMfa.totpPending
        : false
  const derivedMfaPending = derivedMfaPendingSource && !derivedMfaEnabled

  const normalizedRole =
    typeof rawUser.role === 'string' && rawUser.role.trim().length > 0
      ? rawUser.role.trim().toLowerCase()
      : 'user'

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

          const normalizedTenant: { id: string; name?: string; role?: string } = { id }

          if (typeof tenant.name === 'string' && tenant.name.trim().length > 0) {
            normalizedTenant.name = tenant.name.trim()
          }

          if (typeof tenant.role === 'string' && tenant.role.trim().length > 0) {
            normalizedTenant.role = tenant.role.trim().toLowerCase()
          }

          return normalizedTenant
        })
        .filter((tenant): tenant is { id: string; name?: string; role?: string } => Boolean(tenant))
    : undefined

  const normalizedMfa = Object.keys(rawMfa).length
    ? {
        ...rawMfa,
        totpEnabled: Boolean(rawMfa.totpEnabled ?? derivedMfaEnabled),
        totpPending: Boolean(rawMfa.totpPending ?? derivedMfaPending),
      }
    : {
        totpEnabled: derivedMfaEnabled,
        totpPending: derivedMfaPending,
      }

  const normalizedUser = identifier ? { ...rawUser, id: identifier, uuid: identifier } : rawUser

  return {
    ...normalizedUser,
    mfaEnabled: derivedMfaEnabled,
    mfaPending: derivedMfaPending,
    mfa: normalizedMfa,
    role: normalizedRole,
    groups: normalizedGroups,
    permissions: normalizedPermissions,
    tenantId: normalizedTenantId,
    tenants: normalizedTenants,
  }
}

export const handler: Handlers<unknown, FreshState> = {
  /**
   * GET /api/auth/session
   * Get current user session
   */
  async GET(req, _ctx) {
    const token = getSessionToken(req)
    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { response, data } = await fetchSession(token)
    if (!response || !response.ok || !data?.user) {
      const headers = new Headers({ 'Content-Type': 'application/json' })
      clearSessionCookie(headers)
      return new Response(JSON.stringify({ user: null }), { headers })
    }

    const normalizedUser = normalizeUser(data.user)
    return new Response(JSON.stringify({ user: normalizedUser }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },

  /**
   * DELETE /api/auth/session
   * Logout - clear session cookie and notify Account Service
   */
  async DELETE(req, _ctx) {
    const token = getSessionToken(req)
    if (token) {
      await fetch(`${ACCOUNT_API_BASE}/session`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(5000),
      }).catch(() => null)
    }

    const headers = new Headers({ 'Content-Type': 'application/json' })
    clearSessionCookie(headers)
    return new Response(JSON.stringify({ success: true }), { headers })
  },
}
