import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { MFA_COOKIE_NAME, SESSION_COOKIE_NAME } from '@lib/authGateway'
import { getAccountServiceApiBaseUrl } from '@server/serviceConfig'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? ''
  const storedMfaToken = cookieStore.get(MFA_COOKIE_NAME)?.value ?? ''

  const url = new URL(request.url)
  const queryToken = String(url.searchParams.get('token') ?? '').trim()
  const token = queryToken || storedMfaToken
  const identifier = String(
    url.searchParams.get('identifier') ?? url.searchParams.get('email') ?? '',
  ).trim()

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`
  }

  const params = new URLSearchParams()
  if (token) {
    params.set('token', token)
  }
  if (identifier) {
    params.set('identifier', identifier.toLowerCase())
  }

  const endpointParams = params.toString()
  const endpoint = endpointParams
    ? `${ACCOUNT_API_BASE}/mfa/status?${endpointParams}`
    : `${ACCOUNT_API_BASE}/mfa/status`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => ({}))
  return NextResponse.json(payload, { status: response.status })
}
