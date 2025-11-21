import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME } from '@lib/authGateway'
import { getAccountServiceApiBaseUrl } from '@server/serviceConfig'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

async function proxyRequest(request: NextRequest, pathSuffix: string, body?: Record<string, unknown>) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const target = `${ACCOUNT_API_BASE}/subscriptions${pathSuffix}`

  const response = await fetch(target, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  return NextResponse.json(data, { status: response.status })
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, '')
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}))
  return proxyRequest(request, '', payload)
}
