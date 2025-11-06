export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

import { getAccountServiceApiBaseUrl } from '@server/serviceConfig'
import { getAccountSession, userHasRole } from '@server/account/session'
import type { AccountUserRole } from '@server/account/session'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()
const REQUIRED_ROLES: AccountUserRole[] = ['admin']

type ErrorPayload = {
  error: string
}

type RouteParams = {
  params: Promise<{
    userId: string
  }>
}

function resolveUserId(param?: string): string | null {
  if (!param) {
    return null
  }
  const trimmed = param.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getAccountSession(request)
  const user = session.user

  if (!user || !session.token) {
    return NextResponse.json<ErrorPayload>({ error: 'unauthenticated' }, { status: 401 })
  }

  if (!(await userHasRole(user, REQUIRED_ROLES))) {
    return NextResponse.json<ErrorPayload>({ error: 'forbidden' }, { status: 403 })
  }

  const { userId: userIdParam } = await params
  const userId = resolveUserId(userIdParam)
  if (!userId) {
    return NextResponse.json<ErrorPayload>({ error: 'invalid_user' }, { status: 400 })
  }

  const body = await request.text()
  const headers = new Headers({
    Authorization: `Bearer ${session.token}`,
    Accept: 'application/json',
  })
  const contentType = request.headers.get('content-type') ?? 'application/json'
  headers.set('Content-Type', contentType)

  const response = await fetch(`${ACCOUNT_API_BASE}/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'POST',
    headers,
    body,
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => null)
  if (payload === null) {
    return NextResponse.json<ErrorPayload>({ error: 'invalid_response' }, { status: 502 })
  }

  return NextResponse.json(payload, { status: response.status })
}

