/**
 * Auth Gateway - Fresh + Deno Compatible
 *
 * Cookie management for authentication and MFA
 */

export const SESSION_COOKIE_NAME = 'xc_session'
export const MFA_COOKIE_NAME = 'xc_mfa_challenge'

const SESSION_DEFAULT_MAX_AGE = 60 * 60 * 24 // 24 hours
const MFA_DEFAULT_MAX_AGE = 60 * 10 // 10 minutes

function readEnvValue(key: string): string | undefined {
  const value = Deno.env.get(key)
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }
  return undefined
}

function shouldUseSecureCookies(): boolean {
  const explicit =
    parseBoolean(readEnvValue('SESSION_COOKIE_SECURE')) ??
    parseBoolean(readEnvValue('NEXT_PUBLIC_SESSION_COOKIE_SECURE'))
  if (explicit !== undefined) {
    return explicit
  }

  // In Deno, check if we're in production mode
  const denoEnv = Deno.env.get('DENO_ENV') || Deno.env.get('NODE_ENV')
  if (denoEnv === 'production') {
    return true
  }

  const baseUrl =
    readEnvValue('NEXT_PUBLIC_APP_BASE_URL') ??
    readEnvValue('APP_BASE_URL') ??
    readEnvValue('NEXT_PUBLIC_SITE_URL')

  if (typeof baseUrl === 'string' && baseUrl.toLowerCase().startsWith('https://')) {
    return true
  }

  return false
}

interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'Strict' | 'Lax' | 'None'
  path: string
  maxAge?: number
}

const secureCookieBase: Omit<CookieOptions, 'maxAge'> = {
  httpOnly: true,
  secure: shouldUseSecureCookies(),
  sameSite: 'Strict',
  path: '/',
}

/**
 * Convert cookie options to Set-Cookie header value
 */
function buildSetCookieHeader(
  name: string,
  value: string,
  options: CookieOptions
): string {
  const parts = [`${name}=${value}`]

  if (options.path) {
    parts.push(`Path=${options.path}`)
  }

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`)
  }

  if (options.httpOnly) {
    parts.push('HttpOnly')
  }

  if (options.secure) {
    parts.push('Secure')
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`)
  }

  return parts.join('; ')
}

/**
 * Set a cookie in the Response headers
 */
function setCookie(headers: Headers, name: string, value: string, options: CookieOptions) {
  const cookieValue = buildSetCookieHeader(name, value, options)
  headers.append('Set-Cookie', cookieValue)
}

/**
 * Apply session cookie to Response
 */
export function applySessionCookie(headers: Headers, token: string, maxAge?: number) {
  const resolvedMaxAge = Number.isFinite(maxAge) && maxAge && maxAge > 0
    ? Math.floor(maxAge)
    : SESSION_DEFAULT_MAX_AGE

  setCookie(headers, SESSION_COOKIE_NAME, token, {
    ...secureCookieBase,
    maxAge: resolvedMaxAge,
  })
}

/**
 * Clear session cookie from Response
 */
export function clearSessionCookie(headers: Headers) {
  setCookie(headers, SESSION_COOKIE_NAME, '', {
    ...secureCookieBase,
    maxAge: 0,
  })
}

/**
 * Apply MFA cookie to Response
 */
export function applyMfaCookie(headers: Headers, token: string, maxAge?: number) {
  const resolvedMaxAge = Number.isFinite(maxAge) && maxAge && maxAge > 0
    ? Math.floor(maxAge)
    : MFA_DEFAULT_MAX_AGE

  setCookie(headers, MFA_COOKIE_NAME, token, {
    ...secureCookieBase,
    maxAge: resolvedMaxAge,
  })
}

/**
 * Clear MFA cookie from Response
 */
export function clearMfaCookie(headers: Headers) {
  setCookie(headers, MFA_COOKIE_NAME, '', {
    ...secureCookieBase,
    maxAge: 0,
  })
}

/**
 * Calculate maxAge from expiration timestamp
 */
export function deriveMaxAgeFromExpires(
  expiresAt?: string | number | Date | null,
  fallback = SESSION_DEFAULT_MAX_AGE
): number {
  if (!expiresAt) {
    return fallback
  }

  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  const msUntilExpiry = date.getTime() - Date.now()
  if (!Number.isFinite(msUntilExpiry) || msUntilExpiry <= 0) {
    return fallback
  }
  return Math.floor(msUntilExpiry / 1000)
}

/**
 * Parse cookies from request headers
 */
export function getCookies(request: Request): Map<string, string> {
  const cookieHeader = request.headers.get('cookie')
  const cookies = new Map<string, string>()

  if (!cookieHeader) {
    return cookies
  }

  // Parse cookie header: "name1=value1; name2=value2"
  const pairs = cookieHeader.split(';')
  for (const pair of pairs) {
    const trimmed = pair.trim()
    const index = trimmed.indexOf('=')
    if (index > 0) {
      const name = trimmed.substring(0, index)
      const value = trimmed.substring(index + 1)
      cookies.set(name, value)
    }
  }

  return cookies
}

/**
 * Get session token from request cookies
 */
export function getSessionToken(request: Request): string | undefined {
  const cookies = getCookies(request)
  return cookies.get(SESSION_COOKIE_NAME)
}

/**
 * Get MFA token from request cookies
 */
export function getMfaToken(request: Request): string | undefined {
  const cookies = getCookies(request)
  return cookies.get(MFA_COOKIE_NAME)
}
