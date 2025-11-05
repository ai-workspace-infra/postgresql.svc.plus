/**
 * EmailVerificationForm Island - Client-side email verification logic
 *
 * Handles email verification code input and submission
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { AuthLayout } from '@/components/auth/AuthLayout.tsx'

const VERIFICATION_CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

type AlertState = { type: 'error' | 'success' | 'info'; message: string }

interface EmailVerificationFormProps {
  email: string
  status: string | null
  error: string | null
  language: 'zh' | 'en'
}

// Translations
const translations = {
  zh: {
    badge: '邮箱验证',
    title: '验证您的邮箱',
    description: '我们已向 {{email}} 发送了验证码',
    emailFallback: '您的邮箱',
    form: {
      codeLabel: '验证码',
      codePlaceholder: '请输入 6 位验证码',
      helper: '验证码已发送到您的邮箱，请查收',
      submit: '验证邮箱',
      submitting: '验证中...',
    },
    resend: {
      label: '重新发送验证码',
      resending: '发送中...',
    },
    alerts: {
      verificationSent: '验证码已发送',
      verificationResent: '验证码已重新发送',
      verificationReady: '验证成功！正在跳转...',
      verificationFailed: '验证码无效或已过期',
      codeRequired: '请输入验证码',
      missingEmail: '缺少邮箱地址',
      genericError: '操作失败，请稍后重试',
    },
    switchAction: {
      text: '已有账号？',
      link: '立即登录',
    },
    footnote: '验证码有效期为 10 分钟',
    bottomNote: '如未收到验证码，请检查垃圾邮件箱',
  },
  en: {
    badge: 'Email Verification',
    title: 'Verify Your Email',
    description: 'We sent a verification code to {{email}}',
    emailFallback: 'your email',
    form: {
      codeLabel: 'Verification Code',
      codePlaceholder: 'Enter 6-digit code',
      helper: 'Check your email for the verification code',
      submit: 'Verify Email',
      submitting: 'Verifying...',
    },
    resend: {
      label: 'Resend Code',
      resending: 'Sending...',
    },
    alerts: {
      verificationSent: 'Verification code sent',
      verificationResent: 'Verification code resent',
      verificationReady: 'Verification successful! Redirecting...',
      verificationFailed: 'Invalid or expired code',
      codeRequired: 'Please enter verification code',
      missingEmail: 'Email address missing',
      genericError: 'Operation failed, please try again',
    },
    switchAction: {
      text: 'Already have an account?',
      link: 'Sign in',
    },
    footnote: 'Verification code valid for 10 minutes',
    bottomNote: 'If you didn\'t receive the code, check your spam folder',
  },
}

export default function EmailVerificationForm({
  email,
  status: statusParam,
  error: errorParam,
  language,
}: EmailVerificationFormProps) {
  const t = translations[language]
  const redirectTimeoutRef = useRef<number | null>(null)

  const descriptionEmail = email || t.emailFallback || ''
  const description = useMemo(() => {
    if (!t.description.includes('{{email}}')) {
      return t.description
    }
    return t.description.replace('{{email}}', descriptionEmail)
  }, [descriptionEmail, t.description])

  const initialAlert = useMemo<AlertState | null>(() => {
    if (statusParam === 'sent') {
      return { type: 'info', message: t.alerts.verificationSent }
    }
    if (statusParam === 'resent') {
      return {
        type: 'success',
        message: t.alerts.verificationResent ?? t.alerts.verificationSent,
      }
    }
    if (errorParam) {
      const normalized = errorParam
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      const errorMap: Record<string, string> = {
        missing_verification: t.alerts.codeRequired,
        verification_failed: t.alerts.verificationFailed,
        invalid_code: t.alerts.verificationFailed,
        invalid_email: t.alerts.missingEmail,
        code_required: t.alerts.codeRequired,
      }
      const message = errorMap[normalized] ?? t.alerts.genericError
      return { type: normalized === 'already_verified' ? 'success' : 'error', message }
    }
    if (!email) {
      return { type: 'info', message: t.alerts.missingEmail }
    }
    return null
  }, [email, errorParam, statusParam, t.alerts])

  const [alert, setAlert] = useState<AlertState | null>(initialAlert)
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    setAlert(initialAlert)
  }, [initialAlert])

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined
    }

    const timeoutId = globalThis.setTimeout(() => {
      setResendCooldown((previous) => Math.max(previous - 1, 0))
    }, 1000)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [resendCooldown])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        globalThis.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const handleCodeChange = useCallback((event: Event) => {
    const target = event.target as HTMLInputElement
    const digitsOnly = target.value.replace(/\D/g, '').slice(0, VERIFICATION_CODE_LENGTH)
    setCode(digitsOnly)
  }, [])

  const hasEmail = email.length > 0
  const isSubmitDisabled = isSubmitting || !hasEmail || code.length !== VERIFICATION_CODE_LENGTH
  const isResendDisabled = isResending || resendCooldown > 0 || !hasEmail

  const handleSubmit = useCallback(
    async (event: Event) => {
      event.preventDefault()
      if (isSubmitting) {
        return
      }
      if (!hasEmail) {
        setAlert({ type: 'error', message: t.alerts.missingEmail })
        return
      }
      if (code.length !== VERIFICATION_CODE_LENGTH) {
        setAlert({ type: 'error', message: t.alerts.codeRequired })
        return
      }

      setIsSubmitting(true)
      setAlert(null)

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code }),
        })

        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean
          error?: string | null
        }

        if (!response.ok || payload?.success !== true) {
          const errorCode = typeof payload?.error === 'string' ? payload.error : 'verification_failed'
          const normalized = errorCode
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')

          if (normalized === 'already_verified') {
            const message = t.alerts.verificationReady ?? t.alerts.verificationSent
            setAlert({ type: 'success', message })
            redirectTimeoutRef.current = globalThis.setTimeout(() => {
              globalThis.location.href = '/login?registered=1'
            }, 1200)
            return
          }

          const errorMap: Record<string, string> = {
            missing_verification: t.alerts.codeRequired,
            invalid_code: t.alerts.verificationFailed,
            verification_failed: t.alerts.verificationFailed,
            invalid_email: t.alerts.missingEmail,
            code_expired: t.alerts.verificationFailed,
          }
          const message = errorMap[normalized] ?? t.alerts.genericError
          setAlert({ type: 'error', message })
          return
        }

        const successMessage = t.alerts.verificationReady ?? t.alerts.verificationSent
        setAlert({ type: 'success', message: successMessage })
        setCode('')
        redirectTimeoutRef.current = globalThis.setTimeout(() => {
          globalThis.location.href = '/login?registered=1'
        }, 1200)
      } catch (error) {
        console.error('Email verification request failed', error)
        setAlert({ type: 'error', message: t.alerts.genericError })
      } finally {
        setIsSubmitting(false)
      }
    },
    [code, email, hasEmail, isSubmitting, t.alerts],
  )

  const handleResend = useCallback(async () => {
    if (isResending || !hasEmail) {
      if (!hasEmail) {
        setAlert({ type: 'error', message: t.alerts.missingEmail })
      }
      return
    }

    setIsResending(true)

    try {
      const response = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean
        error?: string | null
      }

      if (!response.ok || payload?.success !== true) {
        const errorCode = typeof payload?.error === 'string' ? payload.error : 'verification_failed'
        const normalized = errorCode
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')

        if (normalized === 'already_verified') {
          const message = t.alerts.verificationReady ?? t.alerts.verificationSent
          setAlert({ type: 'success', message })
          redirectTimeoutRef.current = globalThis.setTimeout(() => {
            globalThis.location.href = '/login?registered=1'
          }, 1200)
          return
        }

        const errorMap: Record<string, string> = {
          invalid_email: t.alerts.missingEmail,
          verification_failed: t.alerts.verificationFailed,
          rate_limited: t.alerts.genericError,
        }
        const message = errorMap[normalized] ?? t.alerts.genericError
        setAlert({ type: 'error', message })
        return
      }

      const successMessage = t.alerts.verificationResent ?? t.alerts.verificationSent
      setAlert({ type: 'success', message: successMessage })
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      console.error('Email verification resend failed', error)
      setAlert({ type: 'error', message: t.alerts.genericError })
    } finally {
      setIsResending(false)
    }
  }, [email, hasEmail, isResending, t.alerts])

  const resendLabel = isResending
    ? t.resend.resending ?? t.resend.label
    : resendCooldown > 0
    ? `${t.resend.label} (${resendCooldown}s)`
    : t.resend.label

  return (
    <AuthLayout
      mode="register"
      badge={t.badge}
      title={t.title}
      description={description}
      alert={alert}
      switchAction={{ text: t.switchAction.text, linkLabel: t.switchAction.link, href: '/login' }}
      footnote={t.footnote}
      bottomNote={t.bottomNote}
    >
      <form class="space-y-5" onSubmit={handleSubmit} noValidate>
        <div class="space-y-2">
          <label htmlFor="verification-code" class="text-sm font-medium text-slate-600">
            {t.form.codeLabel}
          </label>
          <input
            id="verification-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t.form.codePlaceholder}
            class="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            value={code}
            onInput={handleCodeChange}
            disabled={isSubmitting || !hasEmail}
            aria-describedby="verification-code-help"
          />
          {t.form.helper ? (
            <p id="verification-code-help" class="text-xs text-slate-500">
              {t.form.helper}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          class="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? t.form.submitting ?? t.form.submit : t.form.submit}
        </button>
      </form>
      <button
        type="button"
        onClick={handleResend}
        class="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isResendDisabled}
      >
        {resendLabel}
      </button>
    </AuthLayout>
  )
}
