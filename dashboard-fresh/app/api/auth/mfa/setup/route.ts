import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { applyMfaCookie, MFA_COOKIE_NAME, SESSION_COOKIE_NAME } from '@lib/authGateway'
import { getAccountServiceApiBaseUrl } from '@server/serviceConfig'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

// This Next.js route proxies MFA provisioning requests to the account service.
// The UI calls /api/auth/mfa/setup, which in turn forwards to the Go backend
// at /api/auth/mfa/totp/provision, keeping browser credentials opaque to the
// external service and letting us manage cookies centrally.

type SetupPayload = {
  token?: string
  issuer?: string
  account?: string
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  let payload: SetupPayload
  try {
    payload = (await request.json()) as SetupPayload
  } catch (error) {
    console.error('Failed to decode MFA setup payload', error)
    return NextResponse.json({ success: false, error: 'invalid_request', needMfa: true }, { status: 400 })
  }

  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? ''
  const cookieToken = cookieStore.get(MFA_COOKIE_NAME)?.value ?? ''
  const token = normalizeString(payload?.token || cookieToken)

  if (!token && !sessionToken) {
    return NextResponse.json({ success: false, error: 'mfa_token_required', needMfa: true }, { status: 400 })
  }

  const issuer = normalizeString(payload?.issuer)
  const account = normalizeString(payload?.account)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`
    }

    const body: Record<string, string> = {}
    if (token) {
      body.token = token
    }
    if (issuer) {
      body.issuer = issuer
    }
    if (account) {
      body.account = account
    }

    const response = await fetch(`${ACCOUNT_API_BASE}/mfa/totp/provision`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const errorCode = typeof (data as { error?: string })?.error === 'string' ? data.error : 'mfa_setup_failed'
      return NextResponse.json({ success: false, error: errorCode, needMfa: true }, { status: response.status || 400 })
    }

    const result = NextResponse.json({ success: true, error: null, needMfa: true, data })
    const nextToken = normalizeString((data as { mfaToken?: string })?.mfaToken || token || cookieToken)
    if (nextToken) {
      applyMfaCookie(result, nextToken)
    }
    return result
  } catch (error) {
    console.error('Account service MFA setup proxy failed', error)
    return NextResponse.json({ success: false, error: 'account_service_unreachable', needMfa: true }, { status: 502 })
  }
}

export function GET() {
  return NextResponse.json(
    { success: false, error: 'method_not_allowed', needMfa: true },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    },
  )
}
