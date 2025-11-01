import { NextRequest, NextResponse } from 'next/server'

import { getAccountServiceApiBaseUrl } from '@lib/serviceConfig'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

type VerifyPayload = {
  email?: string
  code?: string
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeCode(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  let payload: VerifyPayload
  try {
    payload = (await request.json()) as VerifyPayload
  } catch (error) {
    console.error('Failed to decode verification payload', error)
    return NextResponse.json({ success: false, error: 'invalid_request', needMfa: false }, { status: 400 })
  }

  const email = normalizeEmail(payload?.email)
  const code = normalizeCode(payload?.code)

  if (!email || !code) {
    return NextResponse.json({ success: false, error: 'missing_verification', needMfa: false }, { status: 400 })
  }

  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/register/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const errorCode = typeof (data as { error?: string })?.error === 'string' ? data.error : 'verification_failed'
      return NextResponse.json({ success: false, error: errorCode, needMfa: false }, { status: response.status || 400 })
    }

    return NextResponse.json({ success: true, error: null, needMfa: false })
  } catch (error) {
    console.error('Account service verification proxy failed', error)
    return NextResponse.json({ success: false, error: 'account_service_unreachable', needMfa: false }, { status: 502 })
  }
}

export function GET() {
  return NextResponse.json(
    { success: false, error: 'method_not_allowed', needMfa: false },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    },
  )
}
