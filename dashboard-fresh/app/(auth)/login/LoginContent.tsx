'use client'

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Github } from 'lucide-react'

import { AuthLayout, AuthLayoutSocialButton } from '@components/auth/AuthLayout'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'

import { WeChatIcon } from '../../components/icons/WeChatIcon'

type LoginContentProps = {
  accountServiceBaseUrl: string
  children?: ReactNode
}

export default function LoginContent({ accountServiceBaseUrl, children }: LoginContentProps) {
  const { language } = useLanguage()
  const t = translations[language].auth.login
  const alerts = t.alerts
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const sensitiveKeys = ['username', 'password', 'email']
    const hasSensitiveParams = sensitiveKeys.some((key) => searchParams.has(key))

    if (!hasSensitiveParams) {
      return
    }

    const sanitized = new URLSearchParams(searchParams.toString())
    sensitiveKeys.forEach((key) => sanitized.delete(key))

    const queryString = sanitized.toString()
    router.replace(queryString ? `/login?${queryString}` : '/login', { scroll: false })
  }, [router, searchParams])

  const errorParam = searchParams.get('error')
  const registeredParam = searchParams.get('registered')
  const setupMfaParam = searchParams.get('setupMfa')

  const normalize = useCallback(
    (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
    [],
  )

  const githubAuthUrl = process.env.NEXT_PUBLIC_GITHUB_AUTH_URL || '/api/auth/github'
  const wechatAuthUrl = process.env.NEXT_PUBLIC_WECHAT_AUTH_URL || '/api/auth/wechat'
  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || `${accountServiceBaseUrl}/api/auth/login`

  const loginUrlRef = useRef(loginUrl)

  const deriveSameOriginLoginFallback = useCallback((url: string): string | undefined => {
    if (typeof window === 'undefined') {
      return undefined
    }

    try {
      const currentOrigin = window.location.origin
      const parsed = new URL(url, currentOrigin)

      if (parsed.origin === currentOrigin) {
        const relative = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/api/auth/login'
        return relative
      }

      const localHostnames = new Set(['localhost', '127.0.0.1', '[::1]'])
      const parsedHostname = parsed.hostname.toLowerCase()
      const browserHostname = window.location.hostname.toLowerCase()

      const parsedIsLocal = localHostnames.has(parsedHostname)
      const browserIsLocal = localHostnames.has(browserHostname)

      if (!browserIsLocal && parsedIsLocal) {
        const relative = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/api/auth/login'
        return relative
      }

      if (
        window.location.protocol === 'https:' &&
        parsed.protocol === 'http:' &&
        parsedHostname === browserHostname
      ) {
        parsed.protocol = 'https:'
        return parsed.toString()
      }
    } catch (error) {
      console.warn('Failed to derive same-origin login fallback', error)
    }

    return undefined
  }, [])

  useEffect(() => {
    loginUrlRef.current = loginUrl
  }, [loginUrl])

  const socialButtonsDisabled = true

  const initialAlert = useMemo(() => {
    const successMessages: string[] = []
    if (registeredParam === '1') {
      successMessages.push(alerts.registered)
    }
    if (setupMfaParam === '1') {
      const setupRequiredMessage = alerts.mfa?.setupRequired ?? alerts.genericError
      if (setupRequiredMessage) {
        successMessages.push(setupRequiredMessage)
      }
    }

    if (successMessages.length > 0) {
      return { type: 'success', message: successMessages.join(' ') } as const
    }

    if (!errorParam) {
      return null
    }

    const normalizedError = normalize(errorParam)
    const errorMap: Record<string, string> = {
      missing_credentials: alerts.missingCredentials,
      email_and_password_are_required: alerts.missingCredentials,
      invalid_credentials: alerts.invalidCredentials,
      user_not_found: alerts.userNotFound ?? alerts.genericError,
      credentials_in_query: alerts.genericError,
      invalid_request: alerts.genericError,

    }
    const message = errorMap[normalizedError] ?? alerts.genericError
    return { type: 'error', message } as const
  }, [alerts, errorParam, normalize, registeredParam, setupMfaParam])

  const [alert, setAlert] = useState(initialAlert)
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
      const username = String(formData.get('username') ?? '').trim()
      const password = String(formData.get('password') ?? '')
      const remember = formData.get('remember') === 'on'

      if (!username || !password) {
        setAlert({ type: 'error', message: alerts.missingCredentials })
        return
      }

      setIsSubmitting(true)
      setAlert(null)

      try {
        const requestPayload = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            remember,
          }),
        } as const

        let response: Response
        let usedUrl = loginUrlRef.current

        try {
          response = await fetch(usedUrl, requestPayload)
        } catch (primaryError) {
          const sameOriginFallback = deriveSameOriginLoginFallback(usedUrl)
          if (sameOriginFallback && sameOriginFallback !== usedUrl) {
            try {
              response = await fetch(sameOriginFallback, requestPayload)
              loginUrlRef.current = sameOriginFallback
              usedUrl = sameOriginFallback
            } catch (fallbackError) {
              console.error('Primary login request failed, same-origin fallback also failed', fallbackError)
              throw fallbackError
            }
          } else {
            const httpsPattern = /^https:/i
            if (httpsPattern.test(usedUrl)) {
              const insecureUrl = usedUrl.replace(httpsPattern, 'http:')

              try {
                response = await fetch(insecureUrl, requestPayload)
                loginUrlRef.current = insecureUrl
                usedUrl = insecureUrl
              } catch (fallbackError) {
                console.error('Primary login request failed, insecure fallback also failed', fallbackError)
                throw fallbackError
              }
            } else {
              throw primaryError
            }
          }
        }

        if (!response.ok) {
          let errorCode = 'invalid_credentials'
          try {
            const data = await response.json()
            if (typeof data?.error === 'string') {
              errorCode = data.error
            }
          } catch (error) {
            console.error('Failed to parse login response', error)
          }

          const errorMap: Record<string, string> = {
            invalid_credentials: alerts.invalidCredentials,
            missing_credentials: alerts.missingCredentials,
            user_not_found: alerts.userNotFound ?? alerts.genericError,
            invalid_request: alerts.genericError,
            credentials_in_query: alerts.genericError,
          }

          setAlert({ type: 'error', message: errorMap[normalize(errorCode)] ?? alerts.genericError })
          return
        }

        const data: { redirectTo?: string } = await response
          .json()
          .catch(() => ({}))
        router.push(data?.redirectTo || '/')
        router.refresh()
      } catch (error) {
        console.error('Failed to submit login request', error)
        setAlert({ type: 'error', message: alerts.genericError })
      } finally {
        setIsSubmitting(false)
      }
    },
    [alerts, deriveSameOriginLoginFallback, isSubmitting, normalize, router],
  )

  const socialButtons = useMemo<AuthLayoutSocialButton[]>(() => {
    return [
      {
        label: t.social.github,
        href: githubAuthUrl,
        icon: <Github className="h-5 w-5" aria-hidden />, 
        disabled: socialButtonsDisabled,
      },
      {
        label: t.social.wechat,
        href: wechatAuthUrl,
        icon: <WeChatIcon className="h-5 w-5" aria-hidden />, 
        disabled: socialButtonsDisabled,
      },
    ]
  }, [githubAuthUrl, socialButtonsDisabled, t.social.github, t.social.wechat, wechatAuthUrl])

  const formContent = useMemo(() => {
    if (children) {
      return children
    }

    return (
      <form className="space-y-5" method="post" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="login-username" className="text-sm font-medium text-slate-600">
            {t.form.email}
          </label>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder={t.form.emailPlaceholder}
            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="login-password" className="font-medium text-slate-600">
              {t.form.password}
            </label>
            <Link href="#" className="font-medium text-sky-600 hover:text-sky-500">
              {t.forgotPassword}
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={t.form.passwordPlaceholder}
            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            required
          />
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          {t.form.remember}
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? t.form.submitting ?? t.form.submit : t.form.submit}
        </button>
      </form>
    )
  }, [children, handleSubmit, isSubmitting, t])
  return (
    <AuthLayout
      mode="login"
      badge={t.badge}
      title={t.form.title}
      description={t.form.subtitle}
      alert={alert}
      socialHeading={t.social.title}
      socialButtons={socialButtons}
      switchAction={{ text: t.registerPrompt.text, linkLabel: t.registerPrompt.link, href: '/register' }}
      bottomNote={t.bottomNote}
    >
      {formContent}
    </AuthLayout>
  )
}
