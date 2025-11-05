/**
 * RegisterForm Island - Fresh + Preact
 *
 * Multi-step registration form with email verification
 */

import { useSignal, useComputed } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'

interface RegisterFormProps {
  language: 'zh' | 'en'
  onSuccess?: () => void
}

const VERIFICATION_CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const PASSWORD_STRENGTH_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const translations = {
  zh: {
    email: '邮箱',
    emailPlaceholder: '请输入邮箱地址',
    password: '密码',
    passwordPlaceholder: '至少 8 位，包含字母和数字',
    confirmPassword: '确认密码',
    confirmPasswordPlaceholder: '再次输入密码',
    verificationCodeLabel: '邮箱验证码',
    verificationCodeDescription: '我们将向您的邮箱发送 6 位验证码',
    verificationSent: '验证码已发送至您的邮箱',
    verificationResent: '验证码已重新发送',
    verificationCodeResend: '重新发送验证码',
    verificationCodeResending: '正在发送...',
    agreement: '我已阅读并同意',
    terms: '服务条款',
    submit: '注册',
    submitting: '正在注册...',
    verifySubmit: '验证邮箱',
    verifying: '正在验证...',
    completeSubmit: '完成注册',
    completing: '正在完成...',
    missingFields: '请填写所有必填字段',
    invalidEmail: '请输入有效的邮箱地址',
    weakPassword: '密码至少 8 位，需包含字母和数字',
    passwordMismatch: '两次输入的密码不一致',
    agreementRequired: '请阅读并同意服务条款',
    codeRequired: '请输入 6 位验证码',
    invalidCode: '验证码格式不正确',
    userExists: '该邮箱已被注册',
    genericError: '注册失败，请稍后重试',
    verificationFailed: '验证码错误或已过期',
    registrationComplete: '注册成功！正在跳转...',
  },
  en: {
    email: 'Email',
    emailPlaceholder: 'Enter your email address',
    password: 'Password',
    passwordPlaceholder: 'At least 8 chars with letters & numbers',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    verificationCodeLabel: 'Email Verification Code',
    verificationCodeDescription: 'We will send a 6-digit code to your email',
    verificationSent: 'Verification code sent to your email',
    verificationResent: 'Verification code resent',
    verificationCodeResend: 'Resend Code',
    verificationCodeResending: 'Sending...',
    agreement: 'I have read and agree to the',
    terms: 'Terms of Service',
    submit: 'Register',
    submitting: 'Registering...',
    verifySubmit: 'Verify Email',
    verifying: 'Verifying...',
    completeSubmit: 'Complete Registration',
    completing: 'Completing...',
    missingFields: 'Please fill in all required fields',
    invalidEmail: 'Please enter a valid email address',
    weakPassword: 'Password must be at least 8 characters with letters and numbers',
    passwordMismatch: 'Passwords do not match',
    agreementRequired: 'Please read and agree to the Terms of Service',
    codeRequired: 'Please enter the 6-digit verification code',
    invalidCode: 'Invalid verification code format',
    userExists: 'This email is already registered',
    genericError: 'Registration failed. Please try again',
    verificationFailed: 'Verification code is incorrect or expired',
    registrationComplete: 'Registration successful! Redirecting...',
  },
}

export default function RegisterForm({ language, onSuccess }: RegisterFormProps) {
  const t = translations[language]

  const email = useSignal('')
  const password = useSignal('')
  const confirmPassword = useSignal('')
  const agreement = useSignal(false)
  const codeDigits = useSignal<string[]>(Array(VERIFICATION_CODE_LENGTH).fill(''))
  const hasRequestedCode = useSignal(false)
  const isVerified = useSignal(false)
  const pendingEmail = useSignal('')
  const pendingPassword = useSignal('')
  const error = useSignal<string | null>(null)
  const success = useSignal<string | null>(null)
  const isSubmitting = useSignal(false)
  const isResending = useSignal(false)
  const resendCooldown = useSignal(0)

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown.value <= 0) return

    const timer = setInterval(() => {
      resendCooldown.value = resendCooldown.value > 0 ? resendCooldown.value - 1 : 0
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown.value])

  const focusCodeInput = (index: number) => {
    const input = codeInputRefs.current[index]
    if (input) {
      input.focus()
      input.select()
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '')
    const newDigits = [...codeDigits.value]
    newDigits[index] = sanitized ? sanitized[sanitized.length - 1] ?? '' : ''
    codeDigits.value = newDigits

    if (sanitized && index < VERIFICATION_CODE_LENGTH - 1) {
      focusCodeInput(index + 1)
    }
  }

  const handleCodeKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
      event.preventDefault()
      const newDigits = [...codeDigits.value]
      newDigits[index - 1] = ''
      codeDigits.value = newDigits
      focusCodeInput(index - 1)
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusCodeInput(index - 1)
    } else if (event.key === 'ArrowRight' && index < VERIFICATION_CODE_LENGTH - 1) {
      event.preventDefault()
      focusCodeInput(index + 1)
    }
  }

  const handleCodePaste = (index: number, event: ClipboardEvent) => {
    event.preventDefault()
    const clipboardValue = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '')
    if (!clipboardValue) return

    const digits = clipboardValue.slice(0, VERIFICATION_CODE_LENGTH - index).split('')
    const newDigits = [...codeDigits.value]
    digits.forEach((digit, offset) => {
      const targetIndex = index + offset
      if (targetIndex < VERIFICATION_CODE_LENGTH) {
        newDigits[targetIndex] = digit
      }
    })
    codeDigits.value = newDigits

    const lastFilledIndex = Math.min(index + digits.length - 1, VERIFICATION_CODE_LENGTH - 1)
    focusCodeInput(lastFilledIndex)
  }

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    error.value = null
    success.value = null

    const verificationCode = codeDigits.value.join('')

    // Step 1: Request verification code
    if (!hasRequestedCode.value) {
      if (!email.value || !EMAIL_PATTERN.test(email.value)) {
        error.value = t.invalidEmail
        return
      }
      if (!password.value || !confirmPassword.value) {
        error.value = t.missingFields
        return
      }
      if (!PASSWORD_STRENGTH_PATTERN.test(password.value)) {
        error.value = t.weakPassword
        return
      }
      if (password.value !== confirmPassword.value) {
        error.value = t.passwordMismatch
        return
      }
      if (!agreement.value) {
        error.value = t.agreementRequired
        return
      }

      isSubmitting.value = true
      success.value = t.submitting

      try {
        const response = await fetch('/api/auth/register/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.value }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          error.value = data.error === 'email_already_exists' ? t.userExists : t.genericError
          return
        }

        pendingEmail.value = email.value.toLowerCase()
        pendingPassword.value = password.value
        hasRequestedCode.value = true
        codeDigits.value = Array(VERIFICATION_CODE_LENGTH).fill('')
        resendCooldown.value = RESEND_COOLDOWN_SECONDS
        success.value = t.verificationSent
        setTimeout(() => focusCodeInput(0), 100)
      } catch (err) {
        error.value = t.genericError
      } finally {
        isSubmitting.value = false
      }
      return
    }

    // Step 2: Verify code
    if (!isVerified.value) {
      if (verificationCode.length !== VERIFICATION_CODE_LENGTH) {
        error.value = t.codeRequired
        return
      }

      isSubmitting.value = true
      success.value = t.verifying

      try {
        const response = await fetch('/api/auth/register/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingEmail.value, code: verificationCode }),
        })

        if (!response.ok) {
          error.value = t.verificationFailed
          return
        }

        isVerified.value = true
        success.value = t.verifySubmit
      } catch (err) {
        error.value = t.genericError
      } finally {
        isSubmitting.value = false
      }
      return
    }

    // Step 3: Complete registration
    if (verificationCode.length !== VERIFICATION_CODE_LENGTH) {
      error.value = t.codeRequired
      return
    }

    isSubmitting.value = true
    success.value = t.completing

    try {
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail.value,
          password: pendingPassword.value,
          confirmPassword: pendingPassword.value,
          code: verificationCode,
        }),
      })

      if (!registerResponse.ok) {
        const data = await registerResponse.json().catch(() => ({}))
        error.value = data.error === 'email_already_exists' ? t.userExists : t.genericError
        return
      }

      // Auto-login after registration
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail.value,
          password: pendingPassword.value,
        }),
        credentials: 'include',
      })

      if (loginResponse.ok) {
        success.value = t.registrationComplete

        // For first-time registration, always redirect to MFA setup page
        // Users can choose to skip MFA setup if they want
        setTimeout(() => {
          globalThis.location.href = '/panel/account?NeedSetupMfa=1'
        }, 1000)
      } else {
        // Registration succeeded but login failed, redirect to login page
        setTimeout(() => {
          globalThis.location.href = '/login?registered=1'
        }, 1000)
      }
    } catch (err) {
      error.value = t.genericError
    } finally {
      isSubmitting.value = false
    }
  }

  const handleResend = async () => {
    if (isResending.value || resendCooldown.value > 0 || isVerified.value) return

    isResending.value = true
    success.value = t.verificationCodeResending

    try {
      const response = await fetch('/api/auth/register/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail.value }),
      })

      if (!response.ok) {
        error.value = t.genericError
        return
      }

      codeDigits.value = Array(VERIFICATION_CODE_LENGTH).fill('')
      resendCooldown.value = RESEND_COOLDOWN_SECONDS
      success.value = t.verificationResent
      setTimeout(() => focusCodeInput(0), 100)
    } catch (err) {
      error.value = t.genericError
    } finally {
      isResending.value = false
    }
  }

  const isVerificationStep = useComputed(() => hasRequestedCode.value && !isVerified.value)

  return (
    <form onSubmit={handleSubmit} class="space-y-5" noValidate>
      {/* Email */}
      <div class="space-y-2">
        <label htmlFor="email" class="text-sm font-medium text-slate-600">
          {t.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          value={email.value}
          onInput={(e) => (email.value = (e.target as HTMLInputElement).value)}
          disabled={isVerificationStep.value}
          class="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          required
        />
      </div>

      {/* Password fields */}
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-2">
          <label htmlFor="password" class="text-sm font-medium text-slate-600">
            {t.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={t.passwordPlaceholder}
            value={password.value}
            onInput={(e) => (password.value = (e.target as HTMLInputElement).value)}
            disabled={isVerificationStep.value}
            class="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            required
          />
        </div>
        <div class="space-y-2">
          <label htmlFor="confirm-password" class="text-sm font-medium text-slate-600">
            {t.confirmPassword}
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t.confirmPasswordPlaceholder}
            value={confirmPassword.value}
            onInput={(e) => (confirmPassword.value = (e.target as HTMLInputElement).value)}
            disabled={isVerificationStep.value}
            class="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            required
          />
        </div>
      </div>

      {/* Verification code */}
      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-600">
          {t.verificationCodeLabel}
        </label>
        <p class="text-xs text-slate-500">{t.verificationCodeDescription}</p>

        {hasRequestedCode.value && !isVerified.value && (
          <div class="rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-700">
            {language === 'zh'
              ? '我们已向您的邮箱发送验证码，请查收并输入。验证码有效期 10 分钟。'
              : 'We have sent a verification code to your email. Please check and enter it. Valid for 10 minutes.'}
          </div>
        )}

        {hasRequestedCode.value && (
          <div class="flex gap-2">
            {codeDigits.value.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (codeInputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onInput={(e) => handleCodeChange(index, (e.target as HTMLInputElement).value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e as unknown as KeyboardEvent)}
                onPaste={(e) => handleCodePaste(index, e as unknown as ClipboardEvent)}
                disabled={isVerified.value}
                class="h-12 w-12 rounded-xl border-2 border-slate-200 text-center text-lg font-semibold text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:text-slate-400"
              />
            ))}
          </div>
        )}

        {hasRequestedCode.value && !isVerified.value && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown.value > 0 || isResending.value}
            class="text-sm font-medium text-sky-600 hover:text-sky-500 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {resendCooldown.value > 0
              ? `${t.verificationCodeResend} (${resendCooldown.value}s)`
              : t.verificationCodeResend}
          </button>
        )}
      </div>

      {/* Agreement checkbox */}
      <label class="flex items-start gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          name="agreement"
          checked={agreement.value}
          onChange={(e) => (agreement.value = (e.target as HTMLInputElement).checked)}
          disabled={isVerificationStep.value}
          class="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          required
        />
        <span>
          {t.agreement}{' '}
          <a href="/docs" class="font-semibold text-sky-600 hover:text-sky-500">
            {t.terms}
          </a>
        </span>
      </label>

      {/* Error/Success messages */}
      {error.value && (
        <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.value}
        </div>
      )}
      {success.value && !error.value && (
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success.value}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting.value}
        class="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isVerified.value
          ? isSubmitting.value ? t.completing : t.completeSubmit
          : isVerificationStep.value
            ? isSubmitting.value ? t.verifying : t.verifySubmit
            : isSubmitting.value ? t.submitting : t.submit}
      </button>
    </form>
  )
}
