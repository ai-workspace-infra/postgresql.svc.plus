export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

import { getAccountServiceApiBaseUrl } from '@server/serviceConfig'
import { getAccountSession, userHasRole } from '@server/account/session'
import type { AccountUserRole } from '@server/account/session'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

const READ_ROLES: AccountUserRole[] = ['admin', 'operator']
const WRITE_ROLES: AccountUserRole[] = ['admin']

type ErrorPayload = {
  error: string
}

async function proxyAccountRequest(request: NextRequest, endpoint: string, method: string, token: string) {
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  })

  let body: string | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.text()
    const contentType = request.headers.get('content-type') ?? 'application/json'
    headers.set('Content-Type', contentType)
  }

  const response = await fetch(endpoint, {
    method,
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

export async function GET(request: NextRequest) {
  const session = await getAccountSession(request)
  const user = session.user

  if (!user || !session.token) {
    return NextResponse.json<ErrorPayload>({ error: 'unauthenticated' }, { status: 401 })
  }

  if (!(await userHasRole(user, READ_ROLES))) {
    return NextResponse.json<ErrorPayload>({ error: 'forbidden' }, { status: 403 })
  }

  return proxyAccountRequest(request, `${ACCOUNT_API_BASE}/admin/settings`, 'GET', session.token)
}

export async function POST(request: NextRequest) {
  const session = await getAccountSession(request)
  const user = session.user

  if (!user || !session.token) {
    return NextResponse.json<ErrorPayload>({ error: 'unauthenticated' }, { status: 401 })
  }

  if (!(await userHasRole(user, WRITE_ROLES))) {
    return NextResponse.json<ErrorPayload>({ error: 'forbidden' }, { status: 403 })
  }

  return proxyAccountRequest(request, `${ACCOUNT_API_BASE}/admin/settings`, 'POST', session.token)
}

