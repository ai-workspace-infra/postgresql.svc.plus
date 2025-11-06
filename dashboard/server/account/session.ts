'use server'

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE_NAME } from '@lib/authGateway'
import { getAccountServiceApiBaseUrl } from '@server/serviceConfig'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

export type AccountUserRole = 'guest' | 'user' | 'operator' | 'admin'

export type AccountTenantMembership = {
  id: string
  name?: string
  role?: AccountUserRole
}

export type AccountSessionUser = {
  id: string
  uuid: string
  email: string
  name?: string
  username?: string
  role: AccountUserRole
  groups: string[]
  permissions: string[]
  tenantId?: string
  tenants?: AccountTenantMembership[]
}

export type AccountSessionResult = {
  token?: string
  user: AccountSessionUser | null
}

type RawAccountTenant = {
  id?: unknown
  name?: unknown
  role?: unknown
}

type RawAccountUser = {
  id?: unknown
  uuid?: unknown
  email?: unknown
  name?: unknown
  username?: unknown
  role?: unknown
  groups?: unknown
  permissions?: unknown
  tenantId?: unknown
  tenants?: unknown
}

type AccountSessionResponse = {
  user?: RawAccountUser | null
}

const KNOWN_ROLE_MAP: Record<string, AccountUserRole> = {
  admin: 'admin',
  administrator: 'admin',
  operator: 'operator',
  ops: 'operator',
  user: 'user',
  member: 'user',
}

function normalizeRole(value: unknown): AccountUserRole {
  if (typeof value !== 'string') {
    return 'guest'
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return 'guest'
  }
  return KNOWN_ROLE_MAP[normalized] ?? 'guest'
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  const result: string[] = []
  for (const entry of value) {
    const normalized = normalizeString(entry)
    if (normalized) {
      result.push(normalized)
    }
  }
  return result
}

function normalizeTenants(value: unknown): AccountTenantMembership[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  const normalized: AccountTenantMembership[] = []
  for (const tenant of value) {
    if (!tenant || typeof tenant !== 'object') {
      continue
    }
    const raw = tenant as RawAccountTenant
    const identifier = normalizeString(raw.id)
    if (!identifier) {
      continue
    }
    const entry: AccountTenantMembership = { id: identifier }
    const name = normalizeString(raw.name)
    if (name) {
      entry.name = name
    }
    const role = normalizeRole(raw.role)
    if (role !== 'guest') {
      entry.role = role
    }
    normalized.push(entry)
  }
  return normalized.length > 0 ? normalized : undefined
}

function buildUser(raw: RawAccountUser | null | undefined): AccountSessionUser | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const identifier = normalizeString(raw.uuid) ?? normalizeString(raw.id)
  const email = normalizeString(raw.email)
  if (!identifier || !email) {
    return null
  }
  const name = normalizeString(raw.name)
  const username = normalizeString(raw.username) ?? name
  const role = normalizeRole(raw.role)
  const groups = normalizeStringList(raw.groups)
  const permissions = normalizeStringList(raw.permissions)
  const tenantId = normalizeString(raw.tenantId)
  const tenants = normalizeTenants(raw.tenants)

  return {
    id: identifier,
    uuid: identifier,
    email,
    name: name ?? undefined,
    username: username ?? undefined,
    role,
    groups,
    permissions,
    tenantId: tenantId ?? undefined,
    tenants,
  }
}

function extractBearer(value: string | null): string | undefined {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const prefix = 'Bearer '
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length).trim() || undefined
  }
  return trimmed
}

async function resolveTokenFromRequest(request?: NextRequest): Promise<string | undefined> {
  if (request) {
    const authHeader = request.headers.get('authorization')
    const authToken = extractBearer(authHeader)
    if (authToken) {
      return authToken
    }
    const sessionHeader = request.headers.get('x-account-session')
    if (sessionHeader && sessionHeader.trim().length > 0) {
      return sessionHeader.trim()
    }
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (cookieToken && cookieToken.trim().length > 0) {
      return cookieToken.trim()
    }
  }

  try {
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (cookieToken && cookieToken.trim().length > 0) {
      return cookieToken.trim()
    }
  } catch (error) {
    // Accessing cookies() outside a request context throws; ignore and fall through.
    console.warn('Failed to read session cookie from request context', error)
  }

  return undefined
}

export async function userHasRole(
  user: AccountSessionUser | null,
  roles: AccountUserRole[]
): Promise<boolean> {
  if (!user || roles.length === 0) {
    return false
  }
  return roles.includes(user.role)
}

export async function getAccountSession(request?: NextRequest): Promise<AccountSessionResult> {
  const token = await resolveTokenFromRequest(request)
  if (!token) {
    return { token: undefined, user: null }
  }

  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { token, user: null }
    }

    const payload = (await response.json().catch(() => null)) as AccountSessionResponse | null
    if (!payload?.user) {
      return { token, user: null }
    }

    const user = buildUser(payload.user)
    return { token, user }
  } catch (error) {
    console.error('Failed to resolve account session', error)
    return { token, user: null }
  }
}

