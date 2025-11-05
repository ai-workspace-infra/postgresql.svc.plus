/**
 * MFA Status API Route - Fresh + Deno
 *
 * GET /api/auth/mfa/status
 * Checks MFA (Multi-Factor Authentication) status for a user
 */

import { Handlers } from '$fresh/server.ts'
import { getCookies } from '$std/http/cookie.ts'
import { MFA_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/lib/authGateway.deno.ts'
import { getAccountServiceApiBaseUrl } from '@/server/serviceConfig.deno.ts'

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl()

export const handler: Handlers = {
  async GET(req) {
    const cookies = getCookies(req.headers)
    const sessionToken = cookies[SESSION_COOKIE_NAME] ?? ''
    const storedMfaToken = cookies[MFA_COOKIE_NAME] ?? ''

    const url = new URL(req.url)
    const queryToken = String(url.searchParams.get('token') ?? '').trim()
    const token = queryToken || storedMfaToken
    const identifier = String(
      url.searchParams.get('identifier') ?? url.searchParams.get('email') ?? '',
    ).trim()

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

    const endpointParams = params.toString()
    const endpoint = endpointParams
      ? `${ACCOUNT_API_BASE}/mfa/status?${endpointParams}`
      : `${ACCOUNT_API_BASE}/mfa/status`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({}))
    return new Response(JSON.stringify(payload), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
}
