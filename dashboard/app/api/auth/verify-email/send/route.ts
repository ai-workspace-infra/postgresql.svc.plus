import { NextRequest, NextResponse } from 'next/server'

import { getAccountServiceApiBaseUrl } from '@lib/serviceConfig'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

type SendPayload = {
  email?: string
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export async function POST(request: NextRequest) {
  let payload: SendPayload
  try {
    payload = (await request.json()) as SendPayload
  } catch (error) {
    console.error('Failed to decode verification send payload', error)
    return NextResponse.json({ success: false, error: 'invalid_request', needMfa: false }, { status: 400 })
  }

  const email = normalizeEmail(payload?.email)
  if (!email) {
    return NextResponse.json({ success: false, error: 'invalid_email', needMfa: false }, { status: 400 })
  }

  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/register/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const errorCode = typeof (data as { error?: string })?.error === 'string' ? data.error : 'verification_failed'
      return NextResponse.json({ success: false, error: errorCode, needMfa: false }, { status: response.status || 400 })
    }

    return NextResponse.json({ success: true, error: null, needMfa: false })
  } catch (error) {
    console.error('Account service verification send proxy failed', error)
    return NextResponse.json(
      { success: false, error: 'account_service_unreachable', needMfa: false },
      { status: 502 },
    )
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
