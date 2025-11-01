import { NextRequest, NextResponse } from 'next/server'

import { getAccountServiceBaseUrl } from '@lib/serviceConfig'

const ACCOUNT_SERVICE_URL = getAccountServiceBaseUrl()
const ACCOUNT_API_BASE = `${ACCOUNT_SERVICE_URL}/api/auth`

type RegistrationPayload = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  code?: string
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  let payload: RegistrationPayload
  try {
    payload = (await request.json()) as RegistrationPayload
  } catch (error) {
    console.error('Failed to decode registration payload', error)
    return NextResponse.json({ success: false, error: 'invalid_request', needMfa: false }, { status: 400 })
  }

  const email = normalizeEmail(payload?.email)
  const password = typeof payload?.password === 'string' ? payload.password : ''
  const confirmPassword =
    typeof payload?.confirmPassword === 'string' ? payload.confirmPassword : payload?.password ?? ''
  const name = normalizeString(payload?.name)
  const code = normalizeString(payload?.code)

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'missing_credentials', needMfa: false }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ success: false, error: 'password_mismatch', needMfa: false }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ success: false, error: 'verification_required', needMfa: false }, { status: 400 })
  }

  const body = {
    email,
    password,
    code,
    ...(name ? { name } : {}),
  }

  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const errorCode = typeof (data as { error?: string })?.error === 'string' ? data.error : 'registration_failed'
      return NextResponse.json(
        { success: false, error: errorCode, needMfa: false },
        { status: response.status || 400 },
      )
    }

    return NextResponse.json({ success: true, error: null, needMfa: false })
  } catch (error) {
    console.error('Account service registration proxy failed', error)
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
