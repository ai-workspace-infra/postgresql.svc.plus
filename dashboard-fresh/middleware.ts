/**
 * Fresh Middleware - Authentication & Session Management
 *
 * This middleware:
 * 1. Parses authentication cookies from requests
 * 2. Validates session tokens against Account Service
 * 3. Injects user context into request state
 * 4. Handles session refresh logic
 */

import { MiddlewareHandlerContext } from '$fresh/server.ts'
import { getSessionToken, getMfaToken } from '@/lib/authGateway.deno.ts'

const ACCOUNT_API_BASE = Deno.env.get('ACCOUNT_SERVICE_API_BASE_URL') || 'http://localhost:3001/api'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',                 // Homepage
  '/download',         // Download center
  '/docs',             // Documentation
  '/api/ping',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/render-markdown',
  '/api/content-meta',
  '/_fresh',
  '/static',
  '/styles',
]

// Routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/auth/session',
  '/api/auth/mfa',
  '/api/users',
  '/api/task',
  '/api/agent',
  '/api/rag',
  '/api/askai',
  '/api/admin',
  '/api/mail',
]

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

export interface FreshState {
  user?: AccountUser | null
  sessionToken?: string
  mfaToken?: string
  isAuthenticated: boolean
}

/**
 * Check if a route requires authentication
 */
function requiresAuth(pathname: string): boolean {
  // Check if it's a public route
  for (const route of PUBLIC_ROUTES) {
    if (pathname === route || pathname.startsWith(route)) {
      return false
    }
  }

  // Check if it's a protected API route
  for (const route of PROTECTED_API_ROUTES) {
    if (pathname.startsWith(route)) {
      return true
    }
  }

  // Default: pages require auth, API routes are protected
  return pathname.startsWith('/api/') || pathname.startsWith('/panel')
}

/**
 * Validate session token against Account Service
 */
async function validateSessionToken(token: string): Promise<AccountUser | null> {
  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json().catch(() => ({}))) as SessionResponse
    return data?.user || null
  } catch (error) {
    console.error('Session validation failed:', error)
    return null
  }
}

/**
 * Normalize user data from Account Service
 */
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

/**
 * Fresh Middleware Handler
 */
export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<FreshState>
) {
  const url = new URL(req.url)
  const pathname = url.pathname

  // Initialize state
  ctx.state.isAuthenticated = false
  ctx.state.user = null

  // Extract tokens from cookies
  const sessionToken = getSessionToken(req)
  const mfaToken = getMfaToken(req)

  ctx.state.sessionToken = sessionToken
  ctx.state.mfaToken = mfaToken

  // Skip auth check for public routes
  if (!requiresAuth(pathname)) {
    return await ctx.next()
  }

  // Validate session token if present
  if (sessionToken) {
    const user = await validateSessionToken(sessionToken)
    if (user) {
      ctx.state.user = normalizeUser(user)
      ctx.state.isAuthenticated = true
      return await ctx.next()
    }
  }

  // No valid session - return 401 for API routes
  if (pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // For page routes, redirect to login
  const loginUrl = new URL('/login', url.origin)
  loginUrl.searchParams.set('redirect', pathname)

  return new Response(null, {
    status: 302,
    headers: { Location: loginUrl.toString() },
  })
}
