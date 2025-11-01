'use client'

import Link from 'next/link'
import { Github } from 'lucide-react'
import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { AuthLayout, AuthLayoutSocialButton } from '@components/auth/AuthLayout'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import { getAccountServiceBaseUrl } from '@lib/serviceConfig'

import { WeChatIcon } from '../../components/icons/WeChatIcon'

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

const VERIFICATION_CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

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
  const [codeDigits, setCodeDigits] = useState<string[]>(() => Array(VERIFICATION_CODE_LENGTH).fill(''))
  const [hasRequestedCode, setHasRequestedCode] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingPassword, setPendingPassword] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isVerified, setIsVerified] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setAlert(initialAlert)
  }, [initialAlert])

  useEffect(() => {
    if (resendCooldown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const focusCodeInput = useCallback((index: number) => {
    const input = codeInputRefs.current[index]
    if (input) {
      input.focus()
      input.select()
    }
  }, [])

  const resetCodeDigits = useCallback(() => {
    setCodeDigits(Array(VERIFICATION_CODE_LENGTH).fill(''))
  }, [])

  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      const sanitized = value.replace(/\D/g, '')
      setCodeDigits((previous) => {
        const next = [...previous]
        next[index] = sanitized ? sanitized[sanitized.length - 1] ?? '' : ''
        return next
      })

      if (sanitized && index < VERIFICATION_CODE_LENGTH - 1) {
        focusCodeInput(index + 1)
      }
    },
    [focusCodeInput],
  )

  const handleCodeKeyDown = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
        event.preventDefault()
        setCodeDigits((previous) => {
          const next = [...previous]
          next[index - 1] = ''
          return next
        })
        focusCodeInput(index - 1)
        return
      }

      if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        focusCodeInput(index - 1)
        return
      }

      if (event.key === 'ArrowRight' && index < VERIFICATION_CODE_LENGTH - 1) {
        event.preventDefault()
        focusCodeInput(index + 1)
      }
    },
    [codeDigits, focusCodeInput],
  )

  const handleCodePaste = useCallback(
    (index: number, event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
      const clipboardValue = event.clipboardData.getData('text').replace(/\D/g, '')
      if (!clipboardValue) {
        return
      }

      const digits = clipboardValue.slice(0, VERIFICATION_CODE_LENGTH - index).split('')
      setCodeDigits((previous) => {
        const next = [...previous]
        digits.forEach((digit, offset) => {
          const targetIndex = index + offset
          if (targetIndex < VERIFICATION_CODE_LENGTH) {
            next[targetIndex] = digit
          }
        })
        return next
      })

      const lastFilledIndex = Math.min(index + digits.length - 1, VERIFICATION_CODE_LENGTH - 1)
      focusCodeInput(lastFilledIndex)
    },
    [focusCodeInput],
  )

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (isSubmitting) {
        return
      }

      formRef.current = event.currentTarget

      const formData = new FormData(event.currentTarget)
      const name = String(formData.get('name') ?? '').trim()
      const email = String(formData.get('email') ?? '').trim()
      const password = String(formData.get('password') ?? '')
      const confirmPassword = String(formData.get('confirmPassword') ?? '')
      const agreementAccepted = formData.get('agreement') === 'on'
      const verificationCode = codeDigits.join('')

      if (!hasRequestedCode) {
        if (!email || !password || !confirmPassword) {
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
          if (typeof window !== 'undefined') {
            const message = alerts.preSubmitHint ?? 'Click submit to receive your verification code.'
            window.alert(message)
          }

          const fallbackNameFromEmail = email.includes('@') ? email.split('@')[0] : email
          const normalizedName = (name || fallbackNameFromEmail || 'svc_user').trim() || 'svc_user'

          const requestPayload = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: normalizedName,
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
              verification_email_failed: alerts.genericError,
            }

            setAlert({ type: 'error', message: errorMap[normalize(errorCode)] ?? alerts.genericError })
            setIsSubmitting(false)
            return
          }

          try {
            const resendResponse = await fetch('/api/auth/register/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
            })

            if (!resendResponse.ok) {
              let resendError = 'generic_error'
              try {
                const data = await resendResponse.json()
                if (typeof data?.error === 'string') {
                  resendError = data.error
                }
              } catch (error) {
                console.error('Failed to parse resend response after register', error)
              }

              const resendErrorMap: Record<string, string> = {
                invalid_request: alerts.genericError,
                invalid_email: alerts.invalidEmail,
                verification_failed: alerts.verificationFailed ?? alerts.genericError,
                already_verified: alerts.verificationFailed ?? alerts.genericError,
                account_service_unreachable: alerts.genericError,
              }

              setAlert({
                type: 'error',
                message: resendErrorMap[normalize(resendError)] ?? alerts.genericError,
              })
              setIsSubmitting(false)
              return
            }
          } catch (error) {
            console.error('Failed to trigger verification resend after register', error)
            setAlert({ type: 'error', message: alerts.genericError })
            setIsSubmitting(false)
            return
          }

          setPendingEmail(email)
          setPendingPassword(password)
          setHasRequestedCode(true)
          setIsVerified(false)
          resetCodeDigits()
          focusCodeInput(0)
          setResendCooldown(RESEND_COOLDOWN_SECONDS)
          if (typeof window !== 'undefined') {
            const message = alerts.verificationSent ?? 'Verification code sent. Please check your email.'
            window.alert(message)
          }
          setIsSubmitting(false)
        } catch (error) {
          console.error('Failed to register user', error)
          setAlert({ type: 'error', message: alerts.genericError })
          setIsSubmitting(false)
        }
        return
      }

      const emailForVerification = pendingEmail || email
      if (!emailForVerification) {
        setAlert({ type: 'error', message: alerts.invalidEmail })
        return
      }

      if (!isVerified) {
        if (verificationCode.length !== VERIFICATION_CODE_LENGTH) {
          setAlert({ type: 'error', message: alerts.codeRequired ?? alerts.missingFields })
          return
        }

        setIsSubmitting(true)
        setAlert(null)

        try {
          const response = await fetch('/api/auth/register/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: emailForVerification,
              code: verificationCode,
            }),
          })

          if (!response.ok) {
            let errorCode = 'generic_error'
            try {
              const data = await response.json()
              if (typeof data?.error === 'string') {
                errorCode = data.error
              }
            } catch (error) {
              console.error('Failed to parse verification response', error)
            }

            const errorMap: Record<string, string> = {
              invalid_request: alerts.genericError,
              missing_verification: alerts.codeRequired ?? alerts.missingFields,
              invalid_code: alerts.invalidCode ?? alerts.genericError,
              verification_failed: alerts.verificationFailed ?? alerts.genericError,
              account_service_unreachable: alerts.genericError,
            }

            setAlert({ type: 'error', message: errorMap[normalize(errorCode)] ?? alerts.genericError })
            setIsSubmitting(false)
            return
          }

          setIsVerified(true)
          if (typeof window !== 'undefined') {
            const message =
              alerts.verificationReady ?? 'Code verified. Click complete registration to continue.'
            window.alert(message)
          }
          setIsSubmitting(false)
        } catch (error) {
          console.error('Failed to verify email', error)
          setAlert({ type: 'error', message: alerts.genericError })
          setIsSubmitting(false)
        }
        return
      }

      if (!pendingPassword) {
        setAlert({ type: 'error', message: alerts.genericError })
        return
      }

      setIsSubmitting(true)
      setAlert(null)

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailForVerification,
            password: pendingPassword,
          }),
        })

        let data: { success?: boolean; needMfa?: boolean; error?: string; redirectTo?: string } | null = null
        try {
          data = await response.json()
        } catch (error) {
          data = null
        }

        if (!response.ok || !data?.success) {
          const errorCode = typeof data?.error === 'string' ? data.error : 'generic_error'
          const errorMap: Record<string, string> = {
            invalid_credentials: alerts.genericError,
            missing_credentials: alerts.missingFields,
            account_service_unreachable: alerts.genericError,
            authentication_failed: alerts.genericError,
          }

          if (data?.needMfa) {
            router.push('/login?needMfa=1')
            router.refresh()
            setIsSubmitting(false)
            return
          }

          setAlert({ type: 'error', message: errorMap[normalize(errorCode)] ?? alerts.genericError })
          setIsSubmitting(false)
          return
        }

        if (typeof window !== 'undefined') {
          const message =
            alerts.registrationComplete ?? 'Registration complete. Redirecting to your dashboard.'
          window.alert(message)
        }

        router.push(data?.redirectTo || '/')
        router.refresh()
      } catch (error) {
        console.error('Failed to complete registration login', error)
        setAlert({ type: 'error', message: alerts.genericError })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      alerts,
      codeDigits,
      focusCodeInput,
      hasRequestedCode,
      isSubmitting,
      isVerified,
      normalize,
      pendingEmail,
      pendingPassword,
      resetCodeDigits,
      router,
    ],
  )

  const handleResend = useCallback(async () => {
    if (isResending || resendCooldown > 0 || isVerified) {
      return
    }

    const emailFromForm =
      pendingEmail ||
      (formRef.current ? String(new FormData(formRef.current).get('email') ?? '').trim() : '')

    if (!emailFromForm) {
      setAlert({ type: 'error', message: alerts.invalidEmail })
      return
    }

    setIsResending(true)

    try {
      const response = await fetch('/api/auth/register/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailFromForm }),
      })

      if (!response.ok) {
        let errorCode = 'generic_error'
        try {
          const data = await response.json()
          if (typeof data?.error === 'string') {
            errorCode = data.error
          }
        } catch (error) {
          console.error('Failed to parse resend response', error)
        }

        const errorMap: Record<string, string> = {
          invalid_request: alerts.genericError,
          invalid_email: alerts.invalidEmail,
          verification_failed: alerts.verificationFailed ?? alerts.genericError,
          already_verified: alerts.verificationFailed ?? alerts.genericError,
          account_service_unreachable: alerts.genericError,
        }

        setAlert({ type: 'error', message: errorMap[normalize(errorCode)] ?? alerts.genericError })
        setIsResending(false)
        return
      }

      setPendingEmail(emailFromForm)
      setHasRequestedCode(true)
      setIsVerified(false)
      resetCodeDigits()
      focusCodeInput(0)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      if (typeof window !== 'undefined') {
        const message =
          alerts.verificationResent ?? alerts.verificationSent ?? 'Verification code resent.'
        window.alert(message)
      }
      setIsResending(false)
    } catch (error) {
      console.error('Failed to resend verification code', error)
      setAlert({ type: 'error', message: alerts.genericError })
      setIsResending(false)
    }
  }, [alerts, focusCodeInput, isResending, isVerified, normalize, pendingEmail, resetCodeDigits, resendCooldown])

  const aboveForm = t.uuidNote ? (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-700">
      {t.uuidNote}
    </div>
  ) : null

  const isVerificationStep = hasRequestedCode && !isVerified
  const submitLabel = isVerified
    ? isSubmitting
      ? t.form.completing ?? t.form.completeSubmit ?? t.form.submit
      : t.form.completeSubmit ?? t.form.submit
    : isVerificationStep
      ? isSubmitting
        ? t.form.verifying ?? t.form.verifySubmit ?? t.form.submit
        : t.form.verifySubmit ?? t.form.submit
      : isSubmitting
        ? t.form.submitting ?? t.form.submit
        : t.form.submit
  const resendLabel = isResending
    ? t.form.verificationCodeResending ?? t.form.verificationCodeResend
    : resendCooldown > 0
      ? `${t.form.verificationCodeResend} (${resendCooldown}s)`
      : t.form.verificationCodeResend
  const verificationDescriptionId = useId()

  return (
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
      <form
        ref={formRef}
        className="space-y-5"
        method="post"
        onSubmit={handleSubmit}
        noValidate
      >
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
            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            required
            disabled={isVerificationStep}
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
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              required={!isVerificationStep}
              disabled={isVerificationStep}
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
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              required={!isVerificationStep}
              disabled={isVerificationStep}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-600" htmlFor="verification-code-0">
              {t.form.verificationCodeLabel}
            </label>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0 || isVerified}
            className="rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendLabel}
          </button>
          </div>
          {t.form.verificationCodeDescription ? (
            <p
              id={verificationDescriptionId}
              className="text-xs text-slate-500"
            >
              {t.form.verificationCodeDescription}
            </p>
          ) : null}
          <div className="flex gap-2">
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                id={`verification-code-${index}`}
                ref={(element) => {
                  codeInputRefs.current[index] = element
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : undefined}
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) => handleCodeChange(index, event.target.value)}
                onKeyDown={(event) => handleCodeKeyDown(index, event)}
                onPaste={(event) => handleCodePaste(index, event)}
                className="h-12 w-12 rounded-2xl border border-slate-200 bg-white/90 text-center text-lg font-semibold text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                aria-label={`${t.form.verificationCodeLabel} ${index + 1}`}
                aria-describedby={
                  t.form.verificationCodeDescription ? verificationDescriptionId : undefined
                }
                disabled={isVerified}
              />
            ))}
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            name="agreement"
            required={!isVerificationStep}
            disabled={isVerificationStep}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
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
          {submitLabel}
        </button>
      </form>
    </AuthLayout>
  )
}
