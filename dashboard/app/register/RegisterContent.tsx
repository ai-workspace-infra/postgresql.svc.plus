'use client'

import Link from 'next/link'
import { Github } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { AskAIButton } from '@components/AskAIButton'
import { AuthLayout, AuthLayoutSocialButton } from '@components/auth/AuthLayout'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import { getAccountServiceBaseUrl } from '@lib/serviceConfig'

import { WeChatIcon } from '../components/icons/WeChatIcon'

type AlertState = { type: 'error' | 'success'; message: string }

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '').toLowerCase()
}

function ensureHttpsForSameHost(url: string): string {
  if (typeof window === 'undefined') {
    return url
  }

  try {
    const currentOrigin = window.location.origin
    const parsed = new URL(url, currentOrigin)

    if (
      window.location.protocol === 'https:' &&
      parsed.protocol === 'http:' &&
      parsed.hostname === window.location.hostname
    ) {
      parsed.protocol = 'https:'
      return parsed.toString()
    }

    return parsed.toString()
  } catch (error) {
    console.warn('Failed to normalize register URL, falling back to provided value', error)
    return url
  }
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

function preferSameOrigin(url: string): string {
  if (typeof window === 'undefined') {
    return url
  }

  try {
    const currentOrigin = window.location.origin
    const parsed = new URL(url, currentOrigin)

    const parsedHostname = parsed.hostname.toLowerCase()
    const browserHostname = window.location.hostname.toLowerCase()

    const parsedIsLocal = LOCAL_HOSTNAMES.has(parsedHostname)
    const browserIsLocal = LOCAL_HOSTNAMES.has(browserHostname)

    if (!browserIsLocal && parsedIsLocal) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/api/auth/register'
    }

    if (parsed.origin === currentOrigin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/api/auth/register'
    }

    return parsed.toString()
  } catch (error) {
    console.warn('Failed to prefer same-origin register URL, falling back to provided value', error)
    return url
  }
}

function coerceRegisterUrlOverride(rawValue: string | undefined | null, accountServiceBaseUrl: string): string {
  const fallbackUrl = `${accountServiceBaseUrl}/api/auth/register`
  if (!rawValue) {
    return preferSameOrigin(ensureHttpsForSameHost(fallbackUrl))
  }

  const trimmed = rawValue.trim()
  if (!trimmed) {
    return preferSameOrigin(ensureHttpsForSameHost(fallbackUrl))
  }

  const rewritePathname = (pathname: string) => {
    const normalized = normalizePathname(pathname)
    if (normalized === '/register' || normalized === 'register') {
      return '/api/auth/register'
    }
    return undefined
  }

  try {
    const parsed = new URL(trimmed)
    const rewritten = rewritePathname(parsed.pathname)
    if (rewritten) {
      parsed.pathname = rewritten
      return preferSameOrigin(ensureHttpsForSameHost(parsed.toString()))
    }
    return preferSameOrigin(ensureHttpsForSameHost(parsed.toString()))
  } catch (error) {
    try {
      const parsed = new URL(trimmed, 'http://localhost')
      const rewritten = rewritePathname(parsed.pathname)
      if (rewritten) {
        return preferSameOrigin(ensureHttpsForSameHost(`${rewritten}${parsed.search}${parsed.hash}`))
      }
    } catch (relativeError) {
      console.warn('Failed to parse register URL override', relativeError)
    }
    return preferSameOrigin(ensureHttpsForSameHost(trimmed))
  }
}

function deriveSameOriginFallback(url: string): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const currentOrigin = window.location.origin
    const parsed = new URL(url, currentOrigin)
    const preferred = preferSameOrigin(ensureHttpsForSameHost(parsed.toString()))

    if (preferred !== url) {
      return preferred
    }
  } catch (error) {
    console.warn('Failed to derive same-origin fallback for register URL', error)
  }

  return undefined
}

export default function RegisterContent() {
  const { language } = useLanguage()
  const t = translations[language].auth.register
  const alerts = t.alerts
  const searchParams = useSearchParams()
  const router = useRouter()

  const accountServiceBaseUrl = getAccountServiceBaseUrl()
  const githubAuthUrl = process.env.NEXT_PUBLIC_GITHUB_AUTH_URL || '/api/auth/github'
  const wechatAuthUrl = process.env.NEXT_PUBLIC_WECHAT_AUTH_URL || '/api/auth/wechat'
  const registerUrl = coerceRegisterUrlOverride(process.env.NEXT_PUBLIC_REGISTER_URL, accountServiceBaseUrl)
  const isSocialAuthVisible = false

  const socialButtons = useMemo<AuthLayoutSocialButton[]>(() => {
    if (!isSocialAuthVisible) {
      return []
    }

    return [
      {
        label: t.social.github,
        href: githubAuthUrl,
        icon: <Github className="h-5 w-5" aria-hidden />,
      },
      {
        label: t.social.wechat,
        href: wechatAuthUrl,
        icon: <WeChatIcon className="h-5 w-5" aria-hidden />,
      },
    ]
  }, [githubAuthUrl, isSocialAuthVisible, t.social.github, t.social.wechat, wechatAuthUrl])

  const registerUrlRef = useRef(registerUrl)

  useEffect(() => {
    registerUrlRef.current = registerUrl
  }, [registerUrl])

  useEffect(() => {
    const sensitiveKeys = ['username', 'password', 'confirmPassword', 'email']
    const hasSensitiveParams = sensitiveKeys.some((key) => searchParams.has(key))

    if (!hasSensitiveParams) {
      return
    }

    const sanitized = new URLSearchParams(searchParams.toString())
    sensitiveKeys.forEach((key) => sanitized.delete(key))

    const queryString = sanitized.toString()
    router.replace(queryString ? `/register?${queryString}` : '/register', { scroll: false })
  }, [router, searchParams])

  const normalize = useCallback(
    (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
    [],
  )

  const initialAlert = useMemo<AlertState | null>(() => {
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')

    if (successParam === '1') {
      return { type: 'success', message: alerts.success }
    }

    if (!errorParam) {
      return null
    }

    const normalizedError = normalize(errorParam)
    const errorMap: Record<string, string> = {
      missing_fields: alerts.missingFields,
      email_and_password_are_required: alerts.missingFields,
      password_mismatch: alerts.passwordMismatch,
      user_already_exists: alerts.userExists,
      email_must_be_a_valid_address: alerts.invalidEmail,
      password_must_be_at_least_8_characters: alerts.weakPassword,
      email_already_exists: alerts.userExists,
      name_already_exists: alerts.usernameExists ?? alerts.userExists,
      invalid_email: alerts.invalidEmail,
      password_too_short: alerts.weakPassword,
      invalid_name: alerts.invalidName ?? alerts.genericError,
      name_required: alerts.invalidName ?? alerts.genericError,
      credentials_in_query: alerts.genericError,
    }
    const message = errorMap[normalizedError] ?? alerts.genericError
    return { type: 'error', message }
  }, [alerts, normalize, searchParams])

  const [alert, setAlert] = useState<AlertState | null>(initialAlert)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setAlert(initialAlert)
  }, [initialAlert])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (isSubmitting) {
        return
      }

      const formData = new FormData(event.currentTarget)
      const name = String(formData.get('name') ?? '').trim()
      const email = String(formData.get('email') ?? '').trim()
      const password = String(formData.get('password') ?? '')
      const confirmPassword = String(formData.get('confirmPassword') ?? '')
      const agreementAccepted = formData.get('agreement') === 'on'

      if (!name || !email || !password || !confirmPassword) {
        setAlert({ type: 'error', message: alerts.missingFields })
        return
      }

      if (!agreementAccepted) {
        setAlert({ type: 'error', message: alerts.agreementRequired ?? alerts.missingFields })
        return
      }

      if (password !== confirmPassword) {
        setAlert({ type: 'error', message: alerts.passwordMismatch })
        return
      }

      if (password.length < 8) {
        setAlert({ type: 'error', message: alerts.weakPassword })
        return
      }

      setIsSubmitting(true)
      setAlert(null)

      try {
        const requestPayload = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        } as const

        let response: Response
        let usedUrl = registerUrlRef.current

        try {
          response = await fetch(usedUrl, requestPayload)
        } catch (primaryError) {
          const sameOriginFallback = deriveSameOriginFallback(usedUrl)
          if (sameOriginFallback && sameOriginFallback !== usedUrl) {
            try {
              response = await fetch(sameOriginFallback, requestPayload)
              registerUrlRef.current = sameOriginFallback
              usedUrl = sameOriginFallback
            } catch (fallbackError) {
              console.error('Primary register request failed, same-origin fallback also failed', fallbackError)
              throw fallbackError
            }
          } else {
            const httpsPattern = /^https:/i
            if (httpsPattern.test(usedUrl)) {
              const insecureUrl = usedUrl.replace(httpsPattern, 'http:')

              try {
                response = await fetch(insecureUrl, requestPayload)
                registerUrlRef.current = insecureUrl
                usedUrl = insecureUrl
              } catch (fallbackError) {
                console.error('Primary register request failed, insecure fallback also failed', fallbackError)
                throw fallbackError
              }
            } else {
              throw primaryError
            }
          }
        }

        if (!response.ok) {
          let errorCode = 'generic_error'
          try {
            const data = await response.json()
            if (typeof data?.error === 'string') {
              errorCode = data.error
            }
          } catch (error) {
            console.error('Failed to parse register response', error)
          }

          const errorMap: Record<string, string> = {
            invalid_request: alerts.genericError,
            missing_credentials: alerts.missingFields,
            invalid_email: alerts.invalidEmail,
            password_too_short: alerts.weakPassword,
            email_already_exists: alerts.userExists,
            name_already_exists: alerts.usernameExists ?? alerts.userExists,
            invalid_name: alerts.invalidName ?? alerts.genericError,
            name_required: alerts.invalidName ?? alerts.genericError,
            hash_failure: alerts.genericError,
            user_creation_failed: alerts.genericError,
            credentials_in_query: alerts.genericError,
          }

          setAlert({ type: 'error', message: errorMap[normalize(errorCode)] ?? alerts.genericError })
          setIsSubmitting(false)
          return
        }

        setAlert({ type: 'success', message: alerts.success })
        setIsSubmitting(false)
        router.push('/login?registered=1&setupMfa=1')
      } catch (error) {
        console.error('Failed to register user', error)
        setAlert({ type: 'error', message: alerts.genericError })
        setIsSubmitting(false)
      }
    },
    [alerts, isSubmitting, normalize, router],
  )

  const aboveForm = t.uuidNote ? (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-700">
      {t.uuidNote}
    </div>
  ) : null

  return (
    <>
      <AuthLayout
        mode="register"
        badge={t.badge}
        title={t.form.title}
        description={t.form.subtitle}
        alert={alert}
        socialHeading={t.social.title}
        socialButtons={socialButtons}
        aboveForm={aboveForm}
        switchAction={{ text: t.loginPrompt.text, linkLabel: t.loginPrompt.link, href: '/login' }}
        bottomNote={t.bottomNote}
      >
        <form className="space-y-5" method="post" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="full-name" className="text-sm font-medium text-slate-600">
              {t.form.fullName}
            </label>
            <input
              id="full-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t.form.fullNamePlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-600">
              {t.form.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t.form.emailPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              required
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-600">
                {t.form.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={t.form.passwordPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-slate-600">
                {t.form.confirmPassword}
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t.form.confirmPasswordPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                required
              />
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="agreement"
              required
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              {t.form.agreement}{' '}
              <Link href="/docs" className="font-semibold text-sky-600 hover:text-sky-500">
                {t.form.terms}
              </Link>
            </span>
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t.form.submitting ?? t.form.submit : t.form.submit}
          </button>
        </form>
      </AuthLayout>
      <AskAIButton />
    </>
  )
}
