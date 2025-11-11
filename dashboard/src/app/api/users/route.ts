export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { getInternalServerServiceBaseUrl } from '@server/serviceConfig'
import { getAccountSession, userHasRole } from '@server/account/session'
import type { AccountUserRole } from '@server/account/session'

const SERVER_API_BASE = getInternalServerServiceBaseUrl()
const SERVER_USERS_ENDPOINT = `${SERVER_API_BASE}/api/users`

const ALLOWED_ROLES: AccountUserRole[] = ['admin', 'operator']

type ErrorPayload = {
  error: string
}

type PermissionAwareHeaders = {
  'X-User-Role': string
  'X-User-Permissions'?: string
}

function buildForwardHeaders(role: string, permissions: string[]): PermissionAwareHeaders {
  const headers: PermissionAwareHeaders = {
    'X-User-Role': role,
  }
  if (permissions.length > 0) {
    headers['X-User-Permissions'] = permissions.join(',')
  }
  return headers
}

export async function GET() {
  const session = await getAccountSession()
  const user = session.user

  if (!user) {
    return NextResponse.json<ErrorPayload>({ error: 'unauthenticated' }, { status: 401 })
  }

  if (!(await userHasRole(user, ALLOWED_ROLES))) {
    return NextResponse.json<ErrorPayload>({ error: 'forbidden' }, { status: 403 })
  }

  const headers = new Headers({
    Accept: 'application/json',
    ...buildForwardHeaders(user.role, user.permissions),
  })

  const response = await fetch(SERVER_USERS_ENDPOINT, {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => null)
  if (payload === null) {
    return NextResponse.json<ErrorPayload>({ error: 'invalid_response' }, { status: 502 })
  }

  return NextResponse.json(payload, { status: response.status })
}

