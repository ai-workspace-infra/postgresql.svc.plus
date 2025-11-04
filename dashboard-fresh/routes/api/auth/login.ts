/**
 * Login API Handler - Fresh + Deno
 *
 * POST /api/auth/login - Authenticate user
 * GET /api/auth/login - Method not allowed
 * DELETE /api/auth/login - Clear MFA and session cookies
 */

import { Handlers } from '$fresh/server.ts'
import {
  applyMfaCookie,
  applySessionCookie,
  clearMfaCookie,
  clearSessionCookie,
  deriveMaxAgeFromExpires,
  getCookies,
  MFA_COOKIE_NAME,
} from '@/lib/authGateway.deno.ts'
import { getAccountServiceApiBaseUrl } from '@/server/serviceConfig.deno.ts'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

interface LoginPayload {
  email?: string
  password?: string
  remember?: boolean
  totp?: string
  code?: string
  token?: string
}

interface AccountLoginResponse {
  token?: string
  expiresAt?: string
  error?: string
  mfaToken?: string
  needMfa?: boolean
  mfaEnabled?: boolean
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeCode(value: unknown) {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 6) : ''
}

export const handler: Handlers = {
  /**
   * POST /api/auth/login
   * Authenticate user with email and password
   */
  async POST(req, _ctx) {
    let payload: LoginPayload
    try {
      payload = (await req.json()) as LoginPayload
    } catch (error) {
      console.error('Failed to decode login payload', error)
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_request', needMfa: false }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const email = normalizeEmail(payload?.email)
    const password = typeof payload?.password === 'string' ? payload.password : ''
    const totpCode = normalizeCode(payload?.totp ?? payload?.code)
    const remember = Boolean(payload?.remember)

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'missing_credentials', needMfa: false }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    try {
      const loginBody: Record<string, string> = { email, password }
      if (totpCode) {
        loginBody.totpCode = totpCode
      }

      const response = await fetch(`${ACCOUNT_API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginBody),
        signal: AbortSignal.timeout(10000),
      })

      const data = (await response.json().catch(() => ({}))) as AccountLoginResponse

      if (response.ok && typeof data?.token === 'string' && data.token.length > 0) {
        const maxAgeFromBackend = deriveMaxAgeFromExpires(data?.expiresAt)
        const effectiveMaxAge = remember ? Math.max(maxAgeFromBackend, 60 * 60 * 24 * 30) : maxAgeFromBackend

        const headers = new Headers({ 'Content-Type': 'application/json' })
        applySessionCookie(headers, data.token, effectiveMaxAge)
        clearMfaCookie(headers)

        return new Response(JSON.stringify({ success: true, error: null, needMfa: false }), {
          headers,
        })
      }

      const errorCode = typeof data?.error === 'string' ? data.error : 'authentication_failed'
      const needsMfa = Boolean(data?.needMfa || errorCode === 'mfa_required' || errorCode === 'mfa_setup_required')

      if ((response.status === 401 || response.status === 403 || needsMfa) && typeof data?.mfaToken === 'string') {
        const headers = new Headers({ 'Content-Type': 'application/json' })
        applyMfaCookie(headers, data.mfaToken)
        clearSessionCookie(headers)

        return new Response(JSON.stringify({ success: false, error: errorCode, needMfa: true }), {
          status: 401,
          headers,
        })
      }

      const statusCode = response.status || 401
      const headers = new Headers({ 'Content-Type': 'application/json' })
      clearSessionCookie(headers)
      clearMfaCookie(headers)

      return new Response(JSON.stringify({ success: false, error: errorCode, needMfa: false }), {
        status: statusCode,
        headers,
      })
    } catch (error) {
      console.error('Account service login proxy failed', error)
      const headers = new Headers({ 'Content-Type': 'application/json' })
      clearSessionCookie(headers)
      clearMfaCookie(headers)

      return new Response(
        JSON.stringify({ success: false, error: 'account_service_unreachable', needMfa: false }),
        {
          status: 502,
          headers,
        }
      )
    }
  },

  /**
   * GET /api/auth/login
   * Method not allowed
   */
  GET(_req, _ctx) {
    return new Response(
      JSON.stringify({ success: false, error: 'method_not_allowed', needMfa: false }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          Allow: 'POST',
        },
      }
    )
  },

  /**
   * DELETE /api/auth/login
   * Clear MFA and session cookies
   */
  DELETE(req, _ctx) {
    const cookies = getCookies(req)
    const headers = new Headers({ 'Content-Type': 'application/json' })

    if (cookies.has(MFA_COOKIE_NAME)) {
      clearMfaCookie(headers)
    }
    clearSessionCookie(headers)

    return new Response(JSON.stringify({ success: true, error: null, needMfa: false }), {
      headers,
    })
  },
}
