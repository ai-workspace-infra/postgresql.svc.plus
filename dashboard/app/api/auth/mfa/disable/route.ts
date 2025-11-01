import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME, clearSessionCookie } from '@lib/authGateway'
import { getAccountServiceApiBaseUrl } from '@lib/serviceConfig'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

export async function POST(request: NextRequest) {
  void request
  const token = cookies().get(SESSION_COOKIE_NAME)?.value?.trim()

  if (!token) {
    return NextResponse.json({ success: false, error: 'session_required' }, { status: 401 })
  }

  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/mfa/disable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const errorCode = typeof (data as { error?: string })?.error === 'string' ? data.error : 'mfa_disable_failed'
      if (response.status === 401) {
        const result = NextResponse.json({ success: false, error: errorCode })
        clearSessionCookie(result)
        return result
      }
      return NextResponse.json({ success: false, error: errorCode }, { status: response.status || 400 })
    }

    return NextResponse.json({ success: true, error: null, data })
  } catch (error) {
    console.error('Account service MFA disable proxy failed', error)
    return NextResponse.json({ success: false, error: 'account_service_unreachable' }, { status: 502 })
  }
}

export function GET() {
  return NextResponse.json(
    { success: false, error: 'method_not_allowed' },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    },
  )
}
