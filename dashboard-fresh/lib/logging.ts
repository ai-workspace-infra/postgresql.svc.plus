/**
 * Security-Optimized Logging Utilities
 *
 * This module provides safe logging functions that automatically redact
 * or mask sensitive information such as passwords, tokens, MFA codes, etc.
 *
 * SECURITY: Always use these functions instead of direct console.log()
 * when logging data that might contain user information or authentication data.
 */

/**
 * Redact sensitive fields from logs
 *
 * SECURITY: This function prevents accidental logging of sensitive information
 * such as passwords, tokens, MFA secrets, etc.
 *
 * Redacted fields: password, token, accessToken, refreshToken, mfaToken,
 *                  mfaTotpSecret, totp, totpCode, code, secret, privateKey
 */
export function redactSensitiveFields<T extends Record<string, unknown>>(obj: T): T {
  const sensitiveKeys = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'mfaToken',
    'mfaTotpSecret',
    'totp',
    'totpCode',
    'code',
    'secret',
    'privateKey',
    'private_key',
    'key',
    'value',
  ]

  const redacted = { ...obj }

  // Redact top-level sensitive fields
  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key as keyof T] = '[REDACTED]' as unknown as T[keyof T]
    }
  }

  // Redact nested objects
  for (const [key, value] of Object.entries(redacted)) {
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      redacted[key as keyof T] = redactSensitiveFields(value as Record<string, unknown>) as unknown as T[keyof T]
    }
  }

  return redacted
}

/**
 * Mask email address (show first 3 and last 2 chars)
 *
 * Example: manbuzhe2009@qq.com → man***09@qq.com
 *          user@example.com      → use***@example.com
 *
 * SECURITY: Prevents full email address from appearing in logs
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [username, domain] = email.split('@')
  if (username.length <= 5) return `${username[0]}***@${domain}`
  return `${username.substring(0, 3)}***${username.slice(-2)}@${domain}`
}

/**
 * Create safe log object with masked fields
 *
 * SECURITY: Automatically masks emails and redacts sensitive fields
 * Use this instead of direct logging for any data that might contain
 * personal or authentication information.
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object safe for logging
 */
export function safeLog(obj: Record<string, unknown>): Record<string, unknown> {
  const safe = { ...obj }

  // Mask email
  if (safe.email && typeof safe.email === 'string') {
    safe.email = maskEmail(safe.email)
  }

  // Redact sensitive fields
  return redactSensitiveFields(safe)
}

/**
 * Log only the presence of a field (not its value)
 *
 * SECURITY: Use this instead of logging actual password, token, code values
 *
 * @param label - Label for the log message
 * @param value - The value to check (will not be logged)
 * @param hasPrefix - Text to prepend (default: "Has")
 */
export function logFieldPresence(label: string, value: unknown, hasPrefix = 'Has'): string {
  return `${label}: ${hasPrefix} ${!!value}`
}

/**
 * Safe request logger
 * Logs HTTP request details without exposing sensitive data
 */
export function logRequest(method: string, url: string, hasAuth = false, hasPayload = false): Record<string, unknown> {
  return safeLog({
    method,
    url: url.replace(/\?.*$/, ''), // Remove query params for privacy
    hasAuth,
    hasPayload,
  })
}

/**
 * Safe response logger
 * Logs HTTP response details without exposing sensitive data
 */
export function logResponse(status: number, ok: boolean, hasData = false): Record<string, unknown> {
  return {
    status,
    ok,
    hasData,
  }
}
