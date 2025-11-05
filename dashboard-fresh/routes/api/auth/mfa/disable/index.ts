/**
 * MFA Disable API Route - Fresh + Deno
 *
 * POST /api/auth/mfa/disable
 * Disables MFA for the authenticated user
 */

import { Handlers } from '$fresh/server.ts'
import { getCookies } from '$std/http/cookie.ts'
import { SESSION_COOKIE_NAME, clearSessionCookie } from '@/lib/authGateway.deno.ts'
import { getAccountServiceApiBaseUrl } from '@/server/serviceConfig.deno.ts'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

export const handler: Handlers = {
  async POST(req) {
    const cookies = getCookies(req.headers)
    const token = cookies[SESSION_COOKIE_NAME]?.trim()

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'session_required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      )
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
        const errorCode = typeof (data as { error?: string })?.error === 'string'
          ? data.error
          : 'mfa_disable_failed'
        if (response.status === 401) {
          const responseHeaders = new Headers({ 'Content-Type': 'application/json' })
          clearSessionCookie(responseHeaders)
          return new Response(
            JSON.stringify({ success: false, error: errorCode }),
            {
              status: 401,
              headers: responseHeaders,
            },
          )
        }
        return new Response(
          JSON.stringify({ success: false, error: errorCode }),
          {
            status: response.status || 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      return new Response(
        JSON.stringify({ success: true, error: null, data }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    } catch (error) {
      console.error('Account service MFA disable proxy failed', error)
      return new Response(
        JSON.stringify({ success: false, error: 'account_service_unreachable' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  },

  GET() {
    return new Response(
      JSON.stringify({ success: false, error: 'method_not_allowed' }),
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
