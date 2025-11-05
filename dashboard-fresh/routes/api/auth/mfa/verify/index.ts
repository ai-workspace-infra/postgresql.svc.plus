/**
 * MFA Verify API Route - Fresh + Deno
 *
 * POST /api/auth/mfa/verify
 * Verifies TOTP code for MFA authentication
 */

import { Handlers } from '$fresh/server.ts'
import { getCookies } from '$std/http/cookie.ts'
import {
  applyMfaCookie,
  applySessionCookie,
  clearMfaCookie,
  clearSessionCookie,
  deriveMaxAgeFromExpires,
  MFA_COOKIE_NAME,
} from '@/lib/authGateway.deno.ts'
import { getAuthUrl } from '@/config/runtime-loader.ts'

type VerifyPayload = {
  token?: string
  code?: string
  totp?: string
}

type AccountVerifyResponse = {
  token?: string
  expiresAt?: string
  mfaToken?: string
  error?: string
  retryAt?: string
  user?: Record<string, unknown> | null
  mfa?: Record<string, unknown> | null
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCode(value: unknown) {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 6) : ''
}

export const handler: Handlers = {
  async POST(req) {
    console.log('[mfa/verify] ===== Request received =====')

    const cookies = getCookies(req.headers)
    let payload: VerifyPayload

    try {
      payload = (await req.json()) as VerifyPayload
      console.log('[mfa/verify] Payload parsed, has code:', !!(payload?.code || payload?.totp))
    } catch (error) {
      console.error('[mfa/verify] Failed to decode payload:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_request', needMfa: true }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const cookieToken = cookies[MFA_COOKIE_NAME] ?? ''
    const token = normalizeString(payload?.token || cookieToken)
    const code = normalizeCode(payload?.code ?? payload?.totp)

    console.log('[mfa/verify] Has token:', !!token, 'Code length:', code.length)

    if (!token) {
      console.error('[mfa/verify] ✗ Missing MFA token')
      return new Response(
        JSON.stringify({ success: false, error: 'mfa_token_required', needMfa: true }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (!code) {
      console.error('[mfa/verify] ✗ Missing MFA code')
      return new Response(
        JSON.stringify({ success: false, error: 'mfa_code_required', needMfa: true }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    try {
      const authUrl = await getAuthUrl()
      const endpoint = `${authUrl}/api/auth/mfa/totp/verify`

      console.log('[mfa/verify] Calling backend:', endpoint)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, code }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })

      const data = (await response.json().catch(() => ({}))) as AccountVerifyResponse

      console.log('[mfa/verify] Backend response - status:', response.status, 'ok:', response.ok)

      if (response.ok && typeof data?.token === 'string' && data.token.length > 0) {
        console.log('[mfa/verify] ✓ MFA verification successful')

        const responseHeaders = new Headers({ 'Content-Type': 'application/json' })
        applySessionCookie(responseHeaders, data.token, deriveMaxAgeFromExpires(data?.expiresAt))
        clearMfaCookie(responseHeaders)

        return new Response(
          JSON.stringify({ success: true, error: null, needMfa: false, data }),
          {
            status: 200,
            headers: responseHeaders,
          },
        )
      }

      const errorCode = typeof data?.error === 'string' ? data.error : 'mfa_verification_failed'
      console.log('[mfa/verify] ✗ MFA verification failed:', errorCode)

      const responseHeaders = new Headers({ 'Content-Type': 'application/json' })

      if (typeof data?.mfaToken === 'string' && data.mfaToken.trim()) {
        applyMfaCookie(responseHeaders, data.mfaToken)
      } else {
        applyMfaCookie(responseHeaders, token)
      }

      clearSessionCookie(responseHeaders)

      return new Response(
        JSON.stringify({ success: false, error: errorCode, needMfa: true, data }),
        {
          status: response.status || 400,
          headers: responseHeaders,
        },
      )
    } catch (error) {
      console.error('[mfa/verify] ✗ Exception:', error)

      const responseHeaders = new Headers({ 'Content-Type': 'application/json' })
      applyMfaCookie(responseHeaders, token)
      clearSessionCookie(responseHeaders)

      return new Response(
        JSON.stringify({ success: false, error: 'account_service_unreachable', needMfa: true }),
        {
          status: 502,
          headers: responseHeaders,
        },
      )
    }
  },

  GET() {
    return new Response(
      JSON.stringify({ success: false, error: 'method_not_allowed', needMfa: true }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST',
        },
      },
    )
  },
}
