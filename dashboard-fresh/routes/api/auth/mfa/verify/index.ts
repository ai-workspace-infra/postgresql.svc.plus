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
import { getAccountServiceApiBaseUrl } from '@/server/serviceConfig.deno.ts'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

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
    const cookies = getCookies(req.headers)
    let payload: VerifyPayload
    try {
      payload = (await req.json()) as VerifyPayload
    } catch (error) {
      console.error('Failed to decode MFA verification payload', error)
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

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'mfa_token_required', needMfa: true }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: 'mfa_code_required', needMfa: true }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    try {
      const response = await fetch(`${ACCOUNT_API_BASE}/mfa/totp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, code }),
        cache: 'no-store',
      })

      const data = (await response.json().catch(() => ({}))) as AccountVerifyResponse

      if (response.ok && typeof data?.token === 'string' && data.token.length > 0) {
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
      console.error('Account service MFA verification proxy failed', error)
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
