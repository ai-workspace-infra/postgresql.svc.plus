/**
 * LoginForm Island - Fresh + Preact
 *
 * Client-side interactive login form with MFA support
 */

import { useSignal, useComputed } from '@preact/signals'
import { useEffect } from 'preact/hooks'

interface LoginFormProps {
  language: 'zh' | 'en'
  initialEmail?: string
  onSuccess?: () => void
}

// Translation keys
const translations = {
  zh: {
    email: '用户名 / 邮箱',
    emailPlaceholder: '请输入用户名或邮箱',
    password: '密码',
    passwordPlaceholder: '请输入密码',
    totpLabel: '双因素认证码（TOTP）',
    totpPlaceholder: '请输入 6 位验证码',
    mfaMode: '登录模式',
    passwordOnly: '仅密码验证',
    passwordAndTotp: '密码 + 双因素认证',
    remember: '保持登录 30 天',
    forgotPassword: '忘记密码？',
    submit: '登录',
    submitting: '登录中',
    missingEmail: '请输入用户名或邮箱',
    missingPassword: '请输入密码',
    missingTotp: '请输入双因素认证码',
    invalidTotp: '双因素认证码格式不正确（需要 6 位数字）',
    invalidCredentials: '用户名或密码错误',
    userNotFound: '用户不存在',
    mfaRequired: '需要双因素认证',
    genericError: '登录失败，请稍后重试',
    serviceUnavailable: '服务暂时不可用',
    goHome: '返回首页',
    logout: '退出登录',
    success: '欢迎回来，{username}！',
  },
  en: {
    email: 'Username / Email',
    emailPlaceholder: 'Enter username or email',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    totpLabel: 'Two-Factor Code (TOTP)',
    totpPlaceholder: 'Enter 6-digit code',
    mfaMode: 'Login Mode',
    passwordOnly: 'Password Only',
    passwordAndTotp: 'Password + Two-Factor',
    remember: 'Keep me logged in for 30 days',
    forgotPassword: 'Forgot password?',
    submit: 'Sign In',
    submitting: 'Signing in',
    missingEmail: 'Please enter username or email',
    missingPassword: 'Please enter password',
    missingTotp: 'Please enter two-factor code',
    invalidTotp: 'Invalid two-factor code format (6 digits required)',
    invalidCredentials: 'Invalid username or password',
    userNotFound: 'User not found',
    mfaRequired: 'Two-factor authentication required',
    genericError: 'Login failed. Please try again',
    serviceUnavailable: 'Service temporarily unavailable',
    goHome: 'Go Home',
    logout: 'Logout',
    success: 'Welcome back, {username}!',
  },
}

export default function LoginForm({ language, initialEmail = '', onSuccess }: LoginFormProps) {
  const t = translations[language]

  const identifier = useSignal(initialEmail)
  const password = useSignal('')
  const totpCode = useSignal('')
  const remember = useSignal(false)
  const error = useSignal<string | null>(null)
  const isSubmitting = useSignal(false)
  const mfaRequirement = useSignal<'optional' | 'required'>('optional')
  const user = useSignal<{ username: string } | null>(null)

  // Check MFA status when identifier changes
  useEffect(() => {
    const trimmedIdentifier = identifier.value.trim()
    if (!trimmedIdentifier) {
      mfaRequirement.value = 'optional'
      return
    }

    const normalizedIdentifier = trimmedIdentifier.toLowerCase()
    const controller = new AbortController()

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/mfa/status?identifier=${encodeURIComponent(normalizedIdentifier)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          mfaRequirement.value = 'optional'
          return
        }

        const payload = (await response.json().catch(() => ({}))) as {
          mfa?: { totpEnabled?: boolean }
        }

        mfaRequirement.value = payload?.mfa?.totpEnabled ? 'required' : 'optional'
      } catch (lookupError) {
        if ((lookupError as Error)?.name !== 'AbortError') {
          mfaRequirement.value = 'optional'
        }
      }
    }, 300)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [identifier.value])

  // Clear TOTP code when identifier changes
  useEffect(() => {
    totpCode.value = ''
  }, [identifier.value])

  // Clear TOTP code if MFA not required
  useEffect(() => {
    if (mfaRequirement.value !== 'required' && totpCode.value !== '') {
      totpCode.value = ''
    }
  }, [mfaRequirement.value])

  const handleSubmit = async (event: Event) => {
    event.preventDefault()

    const trimmedIdentifier = identifier.value.trim()
    if (!trimmedIdentifier) {
      error.value = t.missingEmail
      return
    }
    if (!password.value) {
      error.value = t.missingPassword
      return
    }

    const requiresTotp = mfaRequirement.value === 'required'
    const sanitizedTotp = totpCode.value.replace(/\D/g, '')

    // If TOTP is provided, validate its format (but don't require it)
    if (sanitizedTotp && sanitizedTotp.length !== 6) {
      error.value = t.invalidTotp
      return
    }

    error.value = null
    isSubmitting.value = true

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: trimmedIdentifier,
          password: password.value,
          totp: sanitizedTotp.length === 6 ? sanitizedTotp : undefined,
          remember: remember.value,
        }),
        credentials: 'include',
      })

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean
        error?: string | null
        needMfa?: boolean
      }

      if (payload.needMfa) {
        mfaRequirement.value = 'required'
        globalThis.location.href = '/panel/account?setupMfa=1'
        return
      }

      const isSuccessful = response.ok && (payload.success ?? true)

      if (!isSuccessful) {
        const messageKey = payload.error ?? 'generic_error'

        // Handle MFA-related errors - update UI to require MFA
        if (
          messageKey === 'mfa_code_required' ||
          messageKey === 'invalid_mfa_code' ||
          messageKey === 'mfa_required' ||
          messageKey === 'mfa_setup_required' ||
          messageKey === 'mfa_challenge_failed'
        ) {
          mfaRequirement.value = 'required'

          // If backend requires MFA code, show appropriate message
          if (messageKey === 'mfa_code_required') {
            error.value = t.missingTotp
          } else if (messageKey === 'invalid_mfa_code') {
            error.value = t.invalidTotp
          } else if (messageKey === 'mfa_challenge_failed') {
            error.value = t.mfaRequired
          } else {
            error.value = t.genericError
          }
        } else {
          // Handle other errors
          switch (messageKey) {
            case 'missing_credentials':
              error.value = t.missingEmail
              break
            case 'invalid_credentials':
              error.value = t.invalidCredentials
              break
            case 'user_not_found':
              error.value = t.userNotFound
              break
            case 'account_service_unreachable':
              error.value = t.serviceUnavailable
              break
            default:
              error.value = t.genericError
              break
          }
        }
        return
      }

      // Fetch session to get user info
      const sessionResponse = await fetch('/api/auth/session', {
        credentials: 'include',
      })

      if (sessionResponse.ok) {
        const sessionData = (await sessionResponse.json()) as {
          user?: { username?: string; email?: string }
        }
        if (sessionData.user?.username) {
          user.value = { username: sessionData.user.username }
        }
      }

      if (onSuccess) {
        onSuccess()
      } else {
        // Redirect to user panel after short delay
        setTimeout(() => {
          globalThis.location.href = '/panel'
        }, 1000)
      }
    } catch (submitError) {
      console.warn('Login failed', submitError)
      error.value = t.genericError
    } finally {
      isSubmitting.value = false
    }
  }

  const handleGoHome = () => {
    globalThis.location.href = '/'
  }

  const handleLogout = () => {
    globalThis.location.href = '/logout'
  }

  const requiresTotpInput = useComputed(() => mfaRequirement.value === 'required')
  const mfaModeLabel = useComputed(() =>
    requiresTotpInput.value ? t.passwordAndTotp : t.passwordOnly
  )

  return (
    <>
      {user.value ? (
        <div class="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/80 p-5 text-sm text-sky-700">
          <p class="text-base font-semibold">
            {t.success.replace('{username}', user.value.username)}
          </p>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGoHome}
              class="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              {t.goHome}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              class="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
            >
              {t.logout}
            </button>
          </div>
        </div>
      ) : (
        <form method="post" onSubmit={handleSubmit} class="space-y-5" noValidate>
          <div class="space-y-2">
            <label htmlFor="login-identifier" class="text-sm font-medium text-slate-600">
              {t.email}
            </label>
            <input
              id="login-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier.value}
              onInput={(event) => (identifier.value = (event.target as HTMLInputElement).value)}
              placeholder={t.emailPlaceholder}
              class="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-slate-600">{t.mfaMode}</p>
            <div class="rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-700">
              {mfaModeLabel}
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <label htmlFor="login-password" class="font-medium text-slate-600">
                {t.password}
              </label>
              <a href="#" class="font-medium text-sky-600 hover:text-sky-500">
                {t.forgotPassword}
              </a>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password.value}
              onInput={(event) => (password.value = (event.target as HTMLInputElement).value)}
              placeholder={t.passwordPlaceholder}
              class="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          {requiresTotpInput.value && (
            <div class="space-y-2">
              <label htmlFor="login-totp" class="text-sm font-medium text-slate-600">
                {t.totpLabel}
              </label>
              <input
                id="login-totp"
                name="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={totpCode.value}
                onInput={(event) => {
                  const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)
                  totpCode.value = digits
                }}
                placeholder={t.totpPlaceholder}
                class="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          )}

          <label class="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="remember"
              class="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              checked={remember.value}
              onChange={(event) => (remember.value = (event.target as HTMLInputElement).checked)}
            />
            {t.remember}
          </label>

          {error.value && <p class="text-sm text-red-600">{error.value}</p>}

          <button
            type="submit"
            disabled={isSubmitting.value}
            class="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting.value ? `${t.submitting}…` : t.submit}
          </button>
        </form>
      )}
    </>
  )
}
