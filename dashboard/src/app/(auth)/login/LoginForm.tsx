'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import { useUser } from '@lib/userStore'

export function LoginForm() {
  const router = useRouter()
  const { language } = useLanguage()
  const pageCopy = translations[language].login
  const authCopy = translations[language].auth.login
  const navCopy = translations[language].nav.account
  const { user, login } = useUser()
  const userEmail = user?.email ?? ''
  const [identifier, setIdentifier] = useState(() => userEmail)
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mfaRequirement, setMfaRequirement] = useState<'optional' | 'required'>(() =>
    user?.mfaEnabled ? 'required' : 'optional',
  )

  useEffect(() => {
    if (userEmail && identifier.trim().length === 0) {
      setIdentifier(userEmail)
    }
  }, [identifier, userEmail])

  useEffect(() => {
    setTotpCode('')
  }, [identifier])

  useEffect(() => {
    if (mfaRequirement !== 'required' && totpCode !== '') {
      setTotpCode('')
    }
  }, [mfaRequirement, totpCode])

  useEffect(() => {
    let isActive = true
    const trimmedIdentifier = identifier.trim()

    if (!trimmedIdentifier) {
      if (isActive) {
        setMfaRequirement('optional')
      }
      return () => {
        isActive = false
      }
    }

    const normalizedIdentifier = trimmedIdentifier.toLowerCase()

    const controller = new AbortController()
    const signal = controller.signal

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/mfa/status?identifier=${encodeURIComponent(normalizedIdentifier)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal,
          },
        )

        if (!isActive || signal.aborted) {
          return
        }

        if (!response.ok) {
          setMfaRequirement('optional')
          return
        }

        const payload = (await response.json().catch(() => ({}))) as {
          mfa?: { totpEnabled?: boolean }
        }

        const requiresMfa = Boolean(payload?.mfa?.totpEnabled)
        setMfaRequirement(requiresMfa ? 'required' : 'optional')
      } catch (lookupError) {
        if ((lookupError as Error)?.name === 'AbortError' || signal.aborted) {
          return
        }
        setMfaRequirement('optional')
      }
    }, 300)

    return () => {
      isActive = false
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [identifier])

  useEffect(() => {
    if (user?.mfaEnabled) {
      setMfaRequirement('required')
    }
  }, [user?.mfaEnabled])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedIdentifier = identifier.trim()
    if (!trimmedIdentifier) {
      setError(pageCopy.missingUsername)
      return
    }
    if (!password) {
      setError(pageCopy.missingPassword)
      return
    }
    const requiresTotp = mfaRequirement === 'required'
    const sanitizedTotp = totpCode.replace(/\D/g, '')

    if (requiresTotp) {
      if (!sanitizedTotp) {
        setError(pageCopy.missingTotp ?? authCopy.alerts.mfa?.missing ?? authCopy.alerts.missingCredentials)
        return
      }

      if (sanitizedTotp.length !== 6) {
        setError(
          authCopy.alerts.mfa?.invalidFormat ??
            authCopy.alerts.mfa?.invalid ??
            pageCopy.missingTotp ??
            authCopy.alerts.missingCredentials,
        )
        return
      }
    } else if (sanitizedTotp && sanitizedTotp.length !== 6) {
      setError(
        authCopy.alerts.mfa?.invalidFormat ??
          authCopy.alerts.mfa?.invalid ??
          pageCopy.missingTotp ??
          authCopy.alerts.missingCredentials,
      )
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: trimmedIdentifier,
          password,
          totp: sanitizedTotp.length === 6 ? sanitizedTotp : undefined,
          remember,
        }),
        credentials: 'include',
      })

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean
        error?: string | null
        needMfa?: boolean
      }

      if (payload.needMfa) {
        setMfaRequirement('required')
        router.replace('/panel/account?setupMfa=1')
        router.refresh()
        return
      }

      const isSuccessful = response.ok && (payload.success ?? true)

      if (!isSuccessful) {
        const messageKey = payload.error ?? 'generic_error'
        if (
          messageKey === 'mfa_code_required' ||
          messageKey === 'invalid_mfa_code' ||
          messageKey === 'mfa_required' ||
          messageKey === 'mfa_setup_required' ||
          messageKey === 'mfa_challenge_failed'
        ) {
          setMfaRequirement('required')
        }
        switch (messageKey) {
          case 'missing_credentials':
            setError(authCopy.alerts.missingCredentials)
            break
          case 'invalid_credentials':
            setError(pageCopy.invalidCredentials)
            break
          case 'user_not_found':
            setError(pageCopy.userNotFound)
            break
          case 'mfa_code_required':
            setError(authCopy.alerts.mfa?.missing ?? pageCopy.missingTotp ?? authCopy.alerts.missingCredentials)
            break
          case 'invalid_mfa_code':
            setError(authCopy.alerts.mfa?.invalid ?? pageCopy.genericError)
            break
          case 'mfa_challenge_failed':
            setError(authCopy.alerts.mfa?.challengeFailed ?? pageCopy.genericError)
            break
          case 'account_service_unreachable':
            setError(pageCopy.serviceUnavailable ?? pageCopy.genericError)
            break
          default:
            setError(pageCopy.genericError)
            break
        }
        return
      }

      await login()
      router.replace('/')
      router.refresh()
    } catch (submitError) {
      console.warn('Login failed', submitError)
      setError(pageCopy.genericError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoHome = () => {
    router.replace('/')
    router.refresh()
  }

  const handleLogout = () => {
    router.push('/logout')
  }

  const requiresTotpInput = mfaRequirement === 'required'
  const mfaModeLabel = requiresTotpInput
    ? authCopy.form.mfa.passwordAndTotp
    : authCopy.form.mfa.passwordOnly

  return (
    <>
      {user ? (
        <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/80 p-5 text-sm text-sky-700">
          <p className="text-base font-semibold">
            {pageCopy.success.replace('{username}', user.username)}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGoHome}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              {pageCopy.goHome}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
            >
              {navCopy.logout}
            </button>
          </div>
        </div>
      ) : null}

      {!user ? (
        <form method="post" onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="login-identifier" className="text-sm font-medium text-slate-600">
              {authCopy.form.email}
            </label>
            <input
              id="login-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={authCopy.form.emailPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{authCopy.form.mfa.mode}</p>
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-700">
              {mfaModeLabel}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="login-password" className="font-medium text-slate-600">
                {authCopy.form.password}
              </label>
              <Link href="#" className="font-medium text-sky-600 hover:text-sky-500">
                {authCopy.forgotPassword}
              </Link>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={authCopy.form.passwordPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
          {requiresTotpInput ? (
            <div className="space-y-2">
              <label htmlFor="login-totp" className="text-sm font-medium text-slate-600">
                {authCopy.form.mfa.codeLabel}
              </label>
              <input
                id="login-totp"
                name="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={totpCode}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '').slice(0, 6)
                  setTotpCode(digits)
                }}
                placeholder={authCopy.form.mfa.codePlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          ) : null}
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            {authCopy.form.remember}
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? `${authCopy.form.submit}…` : authCopy.form.submit}
          </button>
          <p className="text-xs text-slate-500">* {pageCopy.disclaimer}</p>
        </form>
      ) : null}
    </>
  )
}
