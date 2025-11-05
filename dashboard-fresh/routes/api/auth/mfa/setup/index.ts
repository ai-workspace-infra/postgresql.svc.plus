/**
 * MFA Setup API Route - Fresh + Deno
 *
 * POST /api/auth/mfa/setup
 * Provisions TOTP (Time-based One-Time Password) for MFA
 */

import { Handlers } from '$fresh/server.ts'
import { getCookies } from '$std/http/cookie.ts'
import { applyMfaCookie, MFA_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/lib/authGateway.deno.ts'
import { getAccountServiceApiBaseUrl } from '@/server/serviceConfig.deno.ts'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

// This Fresh route proxies MFA provisioning requests to the account service.
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

export const handler: Handlers = {
  async POST(req) {
    const cookies = getCookies(req.headers)
    let payload: SetupPayload
    try {
      payload = (await req.json()) as SetupPayload
    } catch (error) {
      console.error('Failed to decode MFA setup payload', error)
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_request', needMfa: true }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const sessionToken = cookies[SESSION_COOKIE_NAME] ?? ''
    const cookieToken = cookies[MFA_COOKIE_NAME] ?? ''
    const token = normalizeString(payload?.token || cookieToken)

    if (!token && !sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'mfa_token_required', needMfa: true }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
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
        const errorCode = typeof (data as { error?: string })?.error === 'string'
          ? data.error
          : 'mfa_setup_failed'
        return new Response(
          JSON.stringify({ success: false, error: errorCode, needMfa: true }),
          {
            status: response.status || 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      const responseHeaders = new Headers({ 'Content-Type': 'application/json' })
      const nextToken = normalizeString(
        (data as { mfaToken?: string })?.mfaToken || token || cookieToken,
      )
      if (nextToken) {
        applyMfaCookie(responseHeaders, nextToken)
      }
      return new Response(
        JSON.stringify({ success: true, error: null, needMfa: true, data }),
        {
          status: 200,
          headers: responseHeaders,
        },
      )
    } catch (error) {
      console.error('Account service MFA setup proxy failed', error)
      return new Response(
        JSON.stringify({ success: false, error: 'account_service_unreachable', needMfa: true }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
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
