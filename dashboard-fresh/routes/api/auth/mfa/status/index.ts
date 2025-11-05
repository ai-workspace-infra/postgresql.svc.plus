/**
 * MFA Status API Route - Fresh + Deno
 *
 * GET /api/auth/mfa/status
 * Checks MFA (Multi-Factor Authentication) status for a user
 */

import { Handlers } from '$fresh/server.ts'
import { getCookies } from '$std/http/cookie.ts'
import { MFA_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/lib/authGateway.deno.ts'
import { getAuthUrl } from '@/config/runtime-loader.ts'
import { maskEmail } from '@/lib/logging.ts'

export const handler: Handlers = {
  async GET(req) {
    console.log('[mfa/status] Request received')

    const cookies = getCookies(req.headers)
    const sessionToken = cookies[SESSION_COOKIE_NAME] ?? ''
    const storedMfaToken = cookies[MFA_COOKIE_NAME] ?? ''

    const url = new URL(req.url)
    const queryToken = String(url.searchParams.get('token') ?? '').trim()
    const token = queryToken || storedMfaToken
    const identifier = String(
      url.searchParams.get('identifier') ?? url.searchParams.get('email') ?? '',
    ).trim()

    console.log('[mfa/status] Identifier:', identifier ? maskEmail(identifier) : 'none', 'Has session:', !!sessionToken)

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`
    }

    const params = new URLSearchParams()
    if (token) {
      params.set('token', token)
    }
    if (identifier) {
      params.set('identifier', identifier.toLowerCase())
    }

    try {
      const authUrl = await getAuthUrl()
      const endpointParams = params.toString()
      const endpoint = endpointParams
        ? `${authUrl}/api/auth/mfa/status?${endpointParams}`
        : `${authUrl}/api/auth/mfa/status`

      console.log('[mfa/status] Calling backend:', endpoint)

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })

      const payload = await response.json().catch(() => ({}))

      console.log('[mfa/status] Backend response - status:', response.status)

      return new Response(JSON.stringify(payload), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('[mfa/status] ✗ Exception:', error)

      return new Response(
        JSON.stringify({
          error: 'account_service_unreachable',
          mfa: { totpEnabled: false }
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    }
  },
}
