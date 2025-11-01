'use client'

import Link from 'next/link'
import { Github } from 'lucide-react'
import {
  ChangeEvent,
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

import { WeChatIcon } from '../../components/icons/WeChatIcon'

type AlertState = { type: 'error' | 'success'; message: string }

const VERIFICATION_CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const PASSWORD_STRENGTH_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export default function RegisterContent() {
  const { language } = useLanguage()
  const t = translations[language].auth.register
  const alerts = t.alerts
  const searchParams = useSearchParams()
  const router = useRouter()

  const githubAuthUrl = process.env.NEXT_PUBLIC_GITHUB_AUTH_URL || '/api/auth/github'
  const wechatAuthUrl = process.env.NEXT_PUBLIC_WECHAT_AUTH_URL || '/api/auth/wechat'
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
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreement: false,
  })
  const [isFormReady, setIsFormReady] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setAlert(initialAlert)
  }, [initialAlert])

  useEffect(() => {
    setIsFormReady(true)
  }, [])

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

  const handleInputChange = useCallback(
    (field: 'email' | 'password' | 'confirmPassword') =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target
        setFormValues((previous) => ({ ...previous, [field]: value }))
      },
    [],
  )

  const handleAgreementChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((previous) => ({ ...previous, agreement: event.target.checked }))
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
      const emailInput = String(formData.get('email') ?? '').trim()
      const normalizedEmail = emailInput.toLowerCase()
      const password = String(formData.get('password') ?? '')
      const confirmPassword = String(formData.get('confirmPassword') ?? '')
      const agreementAccepted = formData.get('agreement') === 'on'
      const verificationCode = codeDigits.join('')

      setFormValues((previous) => ({
        ...previous,
        email: emailInput,
        password,
        confirmPassword,
        agreement: agreementAccepted,
      }))

      const showError = (message: string) => {
        setAlert({ type: 'error', message })
      }

      if (!hasRequestedCode) {
        if (!emailInput || !EMAIL_PATTERN.test(emailInput)) {
          showError(alerts.invalidEmail)
          return
        }

        if (!password || !confirmPassword) {
          showError(alerts.missingFields)
          return
        }

        if (!PASSWORD_STRENGTH_PATTERN.test(password)) {
          showError(alerts.weakPassword ?? alerts.genericError)
          return
        }

        if (password !== confirmPassword) {
          showError(alerts.passwordMismatch)
          return
        }

        if (!agreementAccepted) {
          showError(alerts.agreementRequired ?? alerts.missingFields)
          return
        }

        setIsSubmitting(true)
        setAlert(null)

        try {
          const response = await fetch('/api/auth/register/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailInput }),
          })

          if (!response.ok) {
            let errorCode = 'generic_error'
            try {
              const data = await response.json()
              if (typeof data?.error === 'string') {
                errorCode = data.error
              }
            } catch (error) {
              console.error('Failed to parse verification send response', error)
            }

            const errorMap: Record<string, string> = {
              invalid_request: alerts.genericError,
              invalid_email: alerts.invalidEmail,
              verification_failed: alerts.verificationFailed ?? alerts.genericError,
              email_already_exists: alerts.userExists,
              account_service_unreachable: alerts.genericError,
            }

            showError(errorMap[normalize(errorCode)] ?? alerts.genericError)
            setIsSubmitting(false)
            return
          }

          setPendingEmail(normalizedEmail)
          setPendingPassword(password)
          setHasRequestedCode(true)
          setIsVerified(false)
          resetCodeDigits()
          focusCodeInput(0)
          setResendCooldown(RESEND_COOLDOWN_SECONDS)

          const successMessage = alerts.verificationSent ?? alerts.genericError
          setAlert({ type: 'success', message: successMessage })
          if (typeof window !== 'undefined') {
            window.alert(successMessage)
          }
        } catch (error) {
          console.error('Failed to request verification code', error)
          showError(alerts.genericError)
        } finally {
          setIsSubmitting(false)
        }
        return
      }

      const emailForVerification = pendingEmail || normalizedEmail
      if (!emailForVerification) {
        showError(alerts.invalidEmail)
        return
      }

      if (!isVerified) {
        if (verificationCode.length !== VERIFICATION_CODE_LENGTH) {
          showError(alerts.codeRequired ?? alerts.invalidCode ?? alerts.missingFields)
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
            body: JSON.stringify({ email: emailForVerification, code: verificationCode }),
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

            showError(errorMap[normalize(errorCode)] ?? alerts.genericError)
            setIsSubmitting(false)
            return
          }

          setIsVerified(true)
          const successMessage = alerts.verificationReady ?? alerts.success
          setAlert({ type: 'success', message: successMessage })
          if (typeof window !== 'undefined') {
            window.alert(successMessage)
          }
        } catch (error) {
          console.error('Failed to verify email', error)
          showError(alerts.genericError)
        } finally {
          setIsSubmitting(false)
        }
        return
      }

      if (!pendingPassword) {
        showError(alerts.genericError)
        return
      }

      if (verificationCode.length !== VERIFICATION_CODE_LENGTH) {
        showError(alerts.codeRequired ?? alerts.invalidCode ?? alerts.genericError)
        return
      }

      setIsSubmitting(true)
      setAlert(null)

      try {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailForVerification,
            password: pendingPassword,
            confirmPassword: pendingPassword,
            code: verificationCode,
          }),
        })

        let registerData: { success?: boolean; error?: string } | null = null
        try {
          registerData = await registerResponse.json()
        } catch (error) {
          registerData = null
        }

        if (!registerResponse.ok || registerData?.success === false) {
          const errorCode =
            typeof registerData?.error === 'string' ? registerData.error : 'registration_failed'
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
            verification_required: alerts.codeRequired ?? alerts.genericError,
            invalid_code: alerts.invalidCode ?? alerts.genericError,
            account_service_unreachable: alerts.genericError,
          }

          showError(errorMap[normalize(errorCode)] ?? alerts.genericError)
          setIsSubmitting(false)
          return
        }

        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailForVerification,
            password: pendingPassword,
          }),
        })

        let loginData:
          | { success?: boolean; needMfa?: boolean; error?: string; redirectTo?: string }
          | null = null
        try {
          loginData = await loginResponse.json()
        } catch (error) {
          loginData = null
        }

        if (!loginResponse.ok || !loginData?.success) {
          const errorCode = typeof loginData?.error === 'string' ? loginData.error : 'generic_error'
          const errorMap: Record<string, string> = {
            invalid_credentials: alerts.genericError,
            missing_credentials: alerts.missingFields,
            account_service_unreachable: alerts.genericError,
            authentication_failed: alerts.genericError,
          }

          if (loginData?.needMfa) {
            router.push('/login?needMfa=1')
            router.refresh()
            setIsSubmitting(false)
            return
          }

          showError(errorMap[normalize(errorCode)] ?? alerts.genericError)
          setIsSubmitting(false)
          return
        }

        const successMessage = alerts.registrationComplete ?? alerts.success
        setAlert({ type: 'success', message: successMessage })
        if (typeof window !== 'undefined') {
          window.alert(successMessage)
        }

        router.push(loginData?.redirectTo || '/')
        router.refresh()
      } catch (error) {
        console.error('Failed to complete registration', error)
        showError(alerts.genericError)
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

    const emailFromFormRaw =
      pendingEmail ||
      (formRef.current ? String(new FormData(formRef.current).get('email') ?? '').trim() : '')

    if (!emailFromFormRaw) {
      setAlert({ type: 'error', message: alerts.invalidEmail })
      return
    }

    const emailFromForm = emailFromFormRaw.trim()

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
          email_already_exists: alerts.userExists,
        }

        setAlert({ type: 'error', message: errorMap[normalize(errorCode)] ?? alerts.genericError })
        setIsResending(false)
        return
      }

      setPendingEmail(emailFromForm.toLowerCase())
      setHasRequestedCode(true)
      setIsVerified(false)
      resetCodeDigits()
      focusCodeInput(0)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      const message = alerts.verificationResent ?? alerts.verificationSent ?? 'Verification code resent.'
      setAlert({ type: 'success', message })
      if (typeof window !== 'undefined') {
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
  const validationHints = t.form.validation
  const validationState = useMemo(() => {
    const messages: string[] = []

    if (!isFormReady && validationHints?.initializing) {
      return { disabled: true, messages: [validationHints.initializing] }
    }

    if (isSubmitting) {
      if (isVerified) {
        messages.push(
          validationHints?.completing ??
            t.form.completing ??
            t.form.completeSubmit ??
            t.form.submit,
        )
      } else if (isVerificationStep) {
        messages.push(
          validationHints?.verifying ??
            t.form.verifying ??
            t.form.verifySubmit ??
            t.form.submit,
        )
      } else {
        messages.push(validationHints?.submitting ?? t.form.submitting ?? t.form.submit)
      }

      return { disabled: true, messages }
    }

    if (!hasRequestedCode) {
      const emailValue = formValues.email.trim()

      if (!emailValue) {
        messages.push(validationHints?.emailMissing ?? alerts.invalidEmail)
      } else if (!EMAIL_PATTERN.test(emailValue)) {
        messages.push(validationHints?.emailInvalid ?? alerts.invalidEmail)
      }

      if (!formValues.password) {
        messages.push(validationHints?.passwordMissing ?? alerts.missingFields)
      }

      if (!formValues.confirmPassword) {
        messages.push(validationHints?.confirmPasswordMissing ?? alerts.missingFields)
      }

      if (formValues.password && !PASSWORD_STRENGTH_PATTERN.test(formValues.password)) {
        messages.push(validationHints?.passwordWeak ?? alerts.weakPassword ?? alerts.genericError)
      }

      if (
        formValues.password &&
        formValues.confirmPassword &&
        formValues.password !== formValues.confirmPassword
      ) {
        messages.push(validationHints?.passwordMismatch ?? alerts.passwordMismatch)
      }

      if (!formValues.agreement) {
        messages.push(
          validationHints?.agreementRequired ?? alerts.agreementRequired ?? alerts.missingFields,
        )
      }

      const uniqueMessages = Array.from(new Set(messages.filter(Boolean)))
      return { disabled: uniqueMessages.length > 0, messages: uniqueMessages }
    }

    if (!isVerified) {
      if (codeDigits.some((digit) => !digit)) {
        messages.push(
          validationHints?.codeIncomplete ??
            alerts.codeRequired ??
            alerts.invalidCode ??
            alerts.missingFields,
        )
      }

      const uniqueMessages = Array.from(new Set(messages.filter(Boolean)))
      return { disabled: uniqueMessages.length > 0, messages: uniqueMessages }
    }

    if (codeDigits.some((digit) => !digit)) {
      messages.push(
        validationHints?.codeIncomplete ??
          alerts.codeRequired ??
          alerts.invalidCode ??
          alerts.missingFields,
      )
    }

    if (!pendingPassword) {
      messages.push(validationHints?.passwordUnavailable ?? alerts.genericError)
    }

    const uniqueMessages = Array.from(new Set(messages.filter(Boolean)))
    return { disabled: uniqueMessages.length > 0, messages: uniqueMessages }
  }, [
    alerts,
    codeDigits,
    formValues,
    hasRequestedCode,
    isFormReady,
    isSubmitting,
    isVerificationStep,
    isVerified,
    pendingPassword,
    t.form.completeSubmit,
    t.form.completing,
    t.form.submit,
    t.form.submitting,
    t.form.verifySubmit,
    t.form.verifying,
    validationHints,
  ])
  const isSubmitDisabled = validationState.disabled
  const validationMessages = validationState.messages

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
            value={formValues.email}
            onChange={handleInputChange('email')}
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
              value={formValues.password}
              onChange={handleInputChange('password')}
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
              value={formValues.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
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
                disabled={!hasRequestedCode || isVerified}
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
            checked={formValues.agreement}
            onChange={handleAgreementChange}
          />
          <span>
            {t.form.agreement}{' '}
            <Link href="/docs" className="font-semibold text-sky-600 hover:text-sky-500">
              {t.form.terms}
            </Link>
          </span>
        </label>
        {validationMessages.length > 0 ? (
          <div
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600"
            role="status"
            aria-live="polite"
          >
            <ul className="list-disc space-y-1 pl-5">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitLabel}
        </button>
      </form>
    </AuthLayout>
  )
}
