/**
 * Login API Handler - Fresh + Deno
 *
 * POST /api/auth/login?step=check_email - Check if email exists and MFA is enabled
 * POST /api/auth/login?step=login - Authenticate user with email and password
 * POST /api/auth/login?step=verify_mfa - Verify MFA code
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
import { getAuthUrl } from '@/config/runtime-loader.ts'

// ============================================================================
// Types
// ============================================================================

interface CheckEmailPayload {
  email?: string
}

interface LoginPayload {
  email?: string
  password?: string
  remember?: boolean
}

interface VerifyMfaPayload {
  totp?: string
  code?: string
  token?: string
}

interface CheckEmailResponse {
  exists: boolean
  mfa_enabled: boolean
}

interface LoginResponse {
  token?: string
  expiresAt?: string
  error?: string
  mfaToken?: string
  mfaEnabled?: boolean
}

interface VerifyMfaResponse {
  token?: string
  expiresAt?: string
  error?: string
  success?: boolean
}

interface ApiResponse {
  success: boolean
  error?: string | null
  mfaEnabled?: boolean
  exists?: boolean
  [key: string]: unknown
}

type LoginStep = 'check_email' | 'login' | 'verify_mfa'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize email address
 */
function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * Normalize TOTP code (6 digits only)
 */
function normalizeCode(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 6) : ''
}

/**
 * Create standard JSON response
 */
function jsonResponse(data: ApiResponse, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers)
  if (!responseHeaders.has('Content-Type')) {
    responseHeaders.set('Content-Type', 'application/json')
  }

  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders,
  })
}

/**
 * Create error response
 */
function errorResponse(
  error: string,
  status = 400,
  additionalData?: Partial<ApiResponse>,
): Response {
  return jsonResponse(
    {
      success: false,
      error,
      ...additionalData,
    },
    status,
  )
}

/**
 * Generic proxy function to call external auth API
 *
 * @param endpoint - API endpoint path (e.g., '/api/auth/check_email')
 * @param body - Request payload
 * @param timeout - Request timeout in milliseconds
 * @returns Response from external API
 */
async function proxy<T>(
  endpoint: string,
  body: Record<string, unknown>,
  timeout = 10000,
): Promise<{ ok: boolean; status: number; data: T }> {
  const authUrl = await getAuthUrl()
  const url = `${authUrl}${endpoint}`

  console.log(`[login-proxy] → ${endpoint}`, { email: body.email || 'N/A' })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    })

    const data = await response.json().catch(() => ({})) as T

    console.log(`[login-proxy] ← ${endpoint} [${response.status}]`, {
      ok: response.ok,
      hasData: !!data,
    })

    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    console.error(`[login-proxy] ✗ ${endpoint} failed:`, error)
    throw error
  }
}

// ============================================================================
// Step Handlers
// ============================================================================

/**
 * Step 1: Check if email exists and MFA is enabled
 */
async function handleCheckEmail(payload: CheckEmailPayload): Promise<Response> {
  const email = normalizeEmail(payload?.email)

  if (!email) {
    return errorResponse('missing_email', 400)
  }

  try {
    const { ok, status, data } = await proxy<CheckEmailResponse>(
      '/api/auth/check_email',
      { email },
    )

    if (ok) {
      return jsonResponse({
        success: true,
        error: null,
        exists: data.exists,
        mfaEnabled: data.mfa_enabled,
      })
    }

    return errorResponse('check_email_failed', status, {
      exists: false,
      mfaEnabled: false,
    })
  } catch (error) {
    console.error('[login] check_email error:', error)
    return errorResponse('account_service_unreachable', 502)
  }
}

/**
 * Step 2: Login with email and password
 */
async function handleLogin(payload: LoginPayload): Promise<Response> {
  console.log('[login/handleLogin] Starting login process')

  const email = normalizeEmail(payload?.email)
  const password = typeof payload?.password === 'string' ? payload.password : ''
  const remember = Boolean(payload?.remember)

  console.log('[login/handleLogin] Email:', email || '(empty)')
  console.log('[login/handleLogin] Has password:', !!password)
  console.log('[login/handleLogin] Remember:', remember)

  if (!email || !password) {
    console.error('[login/handleLogin] ✗ Missing credentials')
    return errorResponse('missing_credentials', 400)
  }

  try {
    console.log('[login/handleLogin] Calling proxy to backend...')
    const { ok, status, data } = await proxy<LoginResponse>('/api/auth/login', {
      email,
      password,
    })

    console.log('[login/handleLogin] Backend response - ok:', ok, 'status:', status)

    // Successful login with token
    if (ok && data?.token) {
      const maxAgeFromBackend = deriveMaxAgeFromExpires(data.expiresAt)
      const effectiveMaxAge = remember
        ? Math.max(maxAgeFromBackend, 60 * 60 * 24 * 30)
        : maxAgeFromBackend

      const headers = new Headers()
      applySessionCookie(headers, data.token, effectiveMaxAge)
      clearMfaCookie(headers)

      console.log('[login/handleLogin] ✓ Login successful, token set')

      return jsonResponse(
        {
          success: true,
          error: null,
        },
        200,
        headers,
      )
    }

    // Authentication failed - MFA is determined by frontend precheck
    // Note: Frontend should call GET /api/auth/mfa/status?identifier=email to check MFA status
    const errorCode = typeof data?.error === 'string' ? data.error : 'authentication_failed'

    console.log('[login/handleLogin] ✗ Authentication failed:', errorCode, 'Has mfaToken:', !!data?.mfaToken)

    const headers = new Headers()
    clearSessionCookie(headers)
    clearMfaCookie(headers)

    return jsonResponse(
      {
        success: false,
        error: errorCode,
      },
      status || 401,
      headers,
    )
  } catch (error) {
    console.error('[login/handleLogin] ✗ Exception:', error)

    const headers = new Headers()
    clearSessionCookie(headers)
    clearMfaCookie(headers)

    return jsonResponse(
      {
        success: false,
        error: 'account_service_unreachable',
      },
      502,
      headers,
    )
  }
}

/**
 * Step 3: Verify MFA code
 */
async function handleVerifyMfa(
  payload: VerifyMfaPayload,
  req: Request,
): Promise<Response> {
  const totpCode = normalizeCode(payload?.totp ?? payload?.code)
  const mfaToken = payload?.token

  if (!totpCode) {
    return errorResponse('missing_totp_code', 400)
  }

  // Get MFA token from cookie if not in payload
  let effectiveMfaToken = mfaToken
  if (!effectiveMfaToken) {
    const cookies = getCookies(req)
    effectiveMfaToken = cookies.get(MFA_COOKIE_NAME)
  }

  if (!effectiveMfaToken) {
    return errorResponse('missing_mfa_token', 401)
  }

  try {
    const { ok, status, data } = await proxy<VerifyMfaResponse>('/api/auth/verify_mfa', {
      totpCode,
      mfaToken: effectiveMfaToken,
    })

    // MFA verification successful
    if (ok && data?.token) {
      const maxAgeFromBackend = deriveMaxAgeFromExpires(data.expiresAt)

      const headers = new Headers()
      applySessionCookie(headers, data.token, maxAgeFromBackend)
      clearMfaCookie(headers)

      console.log('[login] ✓ MFA verification successful')

      return jsonResponse(
        {
          success: true,
          error: null,
        },
        200,
        headers,
      )
    }

    // MFA verification failed
    const errorCode = typeof data?.error === 'string' ? data.error : 'mfa_verification_failed'

    console.log('[login] ✗ MFA verification failed:', errorCode)

    return errorResponse(errorCode, status || 401)
  } catch (error) {
    console.error('[login] verify_mfa error:', error)
    return errorResponse('account_service_unreachable', 502)
  }
}

// ============================================================================
// HTTP Handlers
// ============================================================================

export const handler: Handlers = {
  /**
   * POST /api/auth/login
   * Handle multi-step login flow based on step parameter
   */
  async POST(req, _ctx) {
    console.log('[login] ===== Request received =====')
    console.log('[login] Method:', req.method)
    console.log('[login] URL:', req.url)

    // Parse step from query parameter
    const url = new URL(req.url)
    const step = url.searchParams.get('step') as LoginStep | null
    console.log('[login] Step parameter:', step || 'null (backward compatibility mode)')

    // Parse request payload
    let payload: CheckEmailPayload | LoginPayload | VerifyMfaPayload
    try {
      payload = await req.json()
      console.log('[login] Payload parsed, keys:', Object.keys(payload))
    } catch (error) {
      console.error('[login] Failed to parse request body:', error)
      return errorResponse('invalid_request', 400)
    }

    // Route to appropriate step handler
    switch (step) {
      case 'check_email':
        console.log('[login] → Routing to handleCheckEmail')
        return await handleCheckEmail(payload as CheckEmailPayload)

      case 'login':
        console.log('[login] → Routing to handleLogin')
        return await handleLogin(payload as LoginPayload)

      case 'verify_mfa':
        console.log('[login] → Routing to handleVerifyMfa')
        return await handleVerifyMfa(payload as VerifyMfaPayload, req)

      default:
        // Backward compatibility: if no step specified, assume login
        if (!step) {
          console.log('[login] → Backward compatibility: routing to handleLogin')
          return await handleLogin(payload as LoginPayload)
        }
        console.error('[login] ✗ Invalid step parameter:', step)
        return errorResponse('invalid_step', 400)
    }
  },

  /**
   * GET /api/auth/login
   * Method not allowed
   */
  GET(_req, _ctx) {
    return errorResponse('method_not_allowed', 405)
  },

  /**
   * DELETE /api/auth/login
   * Clear MFA and session cookies
   */
  DELETE(req, _ctx) {
    const cookies = getCookies(req)
    const headers = new Headers()

    if (cookies.has(MFA_COOKIE_NAME)) {
      clearMfaCookie(headers)
    }
    clearSessionCookie(headers)

    console.log('[login] ✓ Session cleared')

    return jsonResponse(
      {
        success: true,
        error: null,
      },
      200,
      headers,
    )
  },
}
