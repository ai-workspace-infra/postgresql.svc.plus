'use client'

import Image from 'next/image'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toDataURL as generateQrCode } from 'qrcode'

import Card from '../components/Card'
import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import { useUser } from '@lib/userStore'

type TotpStatus = {
  totpEnabled?: boolean
  totpPending?: boolean
  totpSecretIssuedAt?: string
  totpConfirmedAt?: string
  totpLockedUntil?: string
}

type ProvisionResponse = {
  secret?: string
  otpauth_url?: string
  issuer?: string
  account?: string
  mfa?: TotpStatus
  user?: { mfa?: TotpStatus }
}

type VerifyResponse = {
  success?: boolean
  error?: string | null
  needMfa?: boolean
  data?: {
    user?: {
      mfa?: TotpStatus
      mfaEnabled?: boolean
      mfaPending?: boolean
    } | null
    mfa?: TotpStatus | null
  }
}

const DEFAULT_TOTP_ISSUER = 'svc.plus'

function applyTotpUriOverrides(originalUri: string, issuer: string, accountName: string) {
  const trimmedUri = originalUri.trim()
  if (!trimmedUri) {
    return ''
  }

  const normalizedIssuer = issuer.trim()
  const normalizedAccount = accountName.trim()

  if (!normalizedIssuer && !normalizedAccount) {
    return trimmedUri
  }

  try {
    const uri = new URL(trimmedUri)
    if (uri.protocol !== 'otpauth:') {
      return trimmedUri
    }

    if (normalizedIssuer) {
      uri.searchParams.set('issuer', normalizedIssuer)
    }

    const labelParts: string[] = []
    if (normalizedIssuer) {
      labelParts.push(encodeURIComponent(normalizedIssuer))
    }
    if (normalizedAccount) {
      labelParts.push(encodeURIComponent(normalizedAccount))
    }

    if (labelParts.length > 0) {
      uri.pathname = `/${labelParts.join(':')}`
    }

    return uri.toString()
  } catch (error) {
    console.warn('Failed to normalize otpauth URI', error)
    return trimmedUri
  }
}

function formatTimestamp(value?: string) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export default function MfaSetupPanel() {
  const { language } = useLanguage()
  const copy = translations[language].userCenter.mfa
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refresh, logout } = useUser()

  const [status, setStatus] = useState<TotpStatus | null>(null)
  const [secret, setSecret] = useState('')
  const [uri, setUri] = useState('')
  const [issuer, setIssuer] = useState('')
  const [accountLabel, setAccountLabel] = useState('')
  const [code, setCode] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const setupRequested = searchParams.get('setupMfa') === '1'
  const hasPendingMfa = Boolean(status?.totpPending && !status?.totpEnabled)
  const requiresSetup = Boolean(user && (!user.mfaEnabled || user.mfaPending))

  const resolveErrorMessage = useCallback(
    (code?: string | null) => {
      if (!code) {
        return copy.error
      }

      const normalized = code.toLowerCase()
      const mapping: Record<string, string> = {
        'mfa_token_required': copy.errors.sessionExpired,
        'session_token_required': copy.errors.sessionExpired,
        'session_required': copy.errors.sessionExpired,
        'invalid_session': copy.errors.sessionExpired,
        'invalid_mfa_token': copy.errors.sessionExpired,
        'mfa_setup_failed': copy.errors.provisioningFailed,
        'mfa_user_lookup_failed': copy.errors.provisioningFailed,
        'mfa_secret_generation_failed': copy.errors.provisioningFailed,
        'mfa_challenge_creation_failed': copy.errors.provisioningFailed,
        'mfa_status_failed': copy.errors.network,
        'account_service_unreachable': copy.errors.network,
        'mfa_disable_failed': copy.errors.disableFailed,
        'mfa_not_enabled': copy.errors.disableFailed,
        'mfa_code_required': copy.errors.missingCode,
        'missing_credentials': copy.errors.missingCode,
        'mfa_secret_missing': copy.errors.provisioningFailed,
        'invalid_mfa_code': copy.errors.invalidCode,
        'mfa_verification_failed': copy.errors.verificationFailed,
        'mfa_update_failed': copy.errors.verificationFailed,
        'mfa_challenge_locked': copy.errors.locked,
      }

      return mapping[normalized] ?? copy.error
    },
    [copy.error, copy.errors],
  )

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/mfa/status', { cache: 'no-store', credentials: 'include' })
      const payload = (await response.json().catch(() => ({}))) as {
        mfa?: TotpStatus
        user?: { mfa?: TotpStatus }
      }
      if (response.ok) {
        setStatus(payload?.mfa ?? payload?.user?.mfa ?? null)
      } else if (response.status === 401) {
        setStatus(payload?.mfa ?? null)
      }
    } catch (err) {
      console.warn('Failed to fetch MFA status', err)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (setupRequested) {
      setIsDialogOpen(true)
    }
  }, [setupRequested])

  useEffect(() => {
    let active = true

    const renderQr = async () => {
      if (!uri) {
        setQrCodeDataUrl('')
        return
      }

      try {
        const dataUrl = await generateQrCode(uri, {
          errorCorrectionLevel: 'M',
          margin: 1,
          scale: 6,
        })
        if (active) {
          setQrCodeDataUrl(dataUrl)
        }
      } catch (error) {
        console.warn('Failed to generate MFA QR code', error)
        if (active) {
          setQrCodeDataUrl('')
        }
      }
    }

    void renderQr()

    return () => {
      active = false
    }
  }, [uri])

  const handleProvision = useCallback(async () => {
    setIsProvisioning(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean
        error?: string | null
        data?: ProvisionResponse
      }
      if (!payload?.success || !payload?.data) {
        setError(resolveErrorMessage(payload?.error))
        return
      }

      const data = payload.data
      const nextSecret = typeof data?.secret === 'string' ? data.secret.trim() : ''
      const nextUri = typeof data?.otpauth_url === 'string' ? data.otpauth_url.trim() : ''
      const nextAccount = typeof data?.account === 'string' ? data.account.trim() : ''

      const resolvedAccountLabel = (() => {
        const email = typeof user?.email === 'string' ? user.email.trim() : ''
        if (email) {
          return email
        }
        const username = typeof user?.username === 'string' ? user.username.trim() : ''
        if (username) {
          return username
        }
        const name = typeof user?.name === 'string' ? user.name.trim() : ''
        if (name) {
          return name
        }
        return nextAccount
      })()

      const resolvedIssuer = DEFAULT_TOTP_ISSUER
      const updatedUri = applyTotpUriOverrides(nextUri, resolvedIssuer, resolvedAccountLabel)

      setSecret(nextSecret)
      setUri(updatedUri)
      setIssuer(resolvedIssuer)
      setAccountLabel(resolvedAccountLabel)
      setCode('')

      const nextStatus = data?.mfa ?? data?.user?.mfa ?? null
      if (nextStatus) {
        setStatus(nextStatus)
      } else {
        void fetchStatus()
      }
    } catch (err) {
      console.warn('Provision TOTP failed', err)
      setError(resolveErrorMessage('account_service_unreachable'))
    } finally {
      setIsProvisioning(false)
    }
  }, [fetchStatus, resolveErrorMessage, user?.email, user?.name, user?.username])

  const handleVerify = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const normalizedCode = code.replace(/\D/g, '').slice(0, 6)
      if (!normalizedCode) {
        setError(resolveErrorMessage('mfa_code_required'))
        return
      }
      setIsVerifying(true)
      setError(null)
      try {
        const response = await fetch('/api/auth/mfa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code: normalizedCode }),
        })
        const payload = (await response.json().catch(() => ({}))) as VerifyResponse
        if (!payload?.success || !response.ok) {
          setError(resolveErrorMessage(payload?.error))
          void fetchStatus()
          return
        }
        const responseStatus = payload?.data?.mfa ?? payload?.data?.user?.mfa ?? null
        const normalizedStatus: TotpStatus = responseStatus
          ? {
              ...responseStatus,
              totpEnabled: Boolean(
                responseStatus.totpEnabled ?? payload?.data?.user?.mfaEnabled ?? true,
              ),
              totpPending:
                Boolean(responseStatus.totpPending ?? payload?.data?.user?.mfaPending) &&
                !Boolean(
                  responseStatus.totpEnabled ?? payload?.data?.user?.mfaEnabled ?? true,
                ),
            }
          : { totpEnabled: true, totpPending: false }
        setStatus(normalizedStatus)
        setSecret('')
        setUri('')
        setIssuer('')
        setAccountLabel('')
        setCode('')
        await refresh()
        void fetchStatus()
        setIsDialogOpen(false)
        router.replace('/panel/account')
        router.refresh()
      } catch (err) {
        console.warn('Verify TOTP failed', err)
        setError(resolveErrorMessage('account_service_unreachable'))
      } finally {
        setIsVerifying(false)
      }
    },
    [code, fetchStatus, refresh, resolveErrorMessage, router],
  )

  const displayStatus = useMemo(() => status ?? user?.mfa ?? null, [status, user?.mfa])

  const lockoutLabel = useMemo(() => {
    if (!displayStatus?.totpLockedUntil || displayStatus?.totpEnabled) {
      return ''
    }
    return formatTimestamp(displayStatus.totpLockedUntil)
  }, [displayStatus?.totpLockedUntil, displayStatus?.totpEnabled])
  const lockoutActive = Boolean(lockoutLabel)

  useEffect(() => {
    if (
      (setupRequested || isDialogOpen) &&
      !displayStatus?.totpEnabled &&
      !secret &&
      !hasPendingMfa &&
      !isProvisioning
    ) {
      void handleProvision()
    }
  }, [
    displayStatus?.totpEnabled,
    handleProvision,
    hasPendingMfa,
    isDialogOpen,
    isProvisioning,
    secret,
    setupRequested,
  ])

  useEffect(() => {
    if (displayStatus?.totpEnabled) {
      setSecret('')
      setUri('')
      setIssuer('')
      setAccountLabel('')
      setCode('')
    }
  }, [displayStatus?.totpEnabled])

  const handleLogoutClick = useCallback(async () => {
    await logout()
    router.replace('/login')
    router.refresh()
  }, [logout, router])

  const handleDisable = useCallback(async () => {
    setIsDisabling(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        credentials: 'include',
      })
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean
        error?: string | null
        data?: { user?: { mfa?: TotpStatus } }
      }
      if (!response.ok || !payload?.success) {
        setError(resolveErrorMessage(payload?.error))
        return
      }
      const nextStatus = payload?.data?.user?.mfa ?? null
      setStatus(nextStatus ?? { totpEnabled: false, totpPending: false })
      setSecret('')
      setUri('')
      setIssuer('')
      setAccountLabel('')
      setCode('')
      await refresh()
      void fetchStatus()
      router.refresh()
    } catch (err) {
      console.warn('Disable TOTP failed', err)
      setError(resolveErrorMessage('account_service_unreachable'))
    } finally {
      setIsDisabling(false)
    }
  }, [fetchStatus, refresh, resolveErrorMessage, router])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
    setError(null)
    if (setupRequested) {
      router.replace('/panel/account')
    }
  }, [router, setupRequested])

  const openDialog = useCallback(() => {
    setError(null)
    setIsDialogOpen(true)
  }, [])

  if (!user) {
    return (
      <Card>
        <h2 className="text-xl font-semibold text-[var(--color-text)]">{copy.title}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-subtle)]">{copy.subtitle}</p>
      </Card>
    )
  }

  const statusLabel = displayStatus?.totpEnabled
    ? copy.state.enabled
    : displayStatus?.totpPending || hasPendingMfa
      ? copy.state.pending
      : copy.state.disabled

  return (
    <>
      <Card>
        <div className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text)]">{copy.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-subtle)]">{copy.summary.description}</p>
              <dl className="mt-4 grid gap-4 text-xs text-[var(--color-text-subtle)] sm:grid-cols-2">
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.summary.statusLabel}</dt>
                  <dd className="mt-1 text-sm text-[var(--color-text)]">{statusLabel}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.status.issuedAt}</dt>
                  <dd className="mt-1 text-sm text-[var(--color-text)]">{formatTimestamp(displayStatus?.totpSecretIssuedAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.status.confirmedAt}</dt>
                  <dd className="mt-1 text-sm text-[var(--color-text)]">{formatTimestamp(displayStatus?.totpConfirmedAt)}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <button
                type="button"
                onClick={openDialog}
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-primary-hover)]"
              >
                {displayStatus?.totpEnabled ? copy.summary.manage : copy.summary.bind}
              </button>
              {requiresSetup ? (
                <p className="text-xs text-[var(--color-warning-foreground)]">{copy.lockedMessage}</p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {isDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4 py-10"
          onClick={closeDialog}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeDialog}
              aria-label={copy.modal.close}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] text-xl text-[var(--color-text-subtle)] opacity-80 transition hover:border-[color:var(--color-surface-border)] hover:text-[var(--color-text-subtle)]"
            >
              ×
            </button>
            <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-[var(--color-text)]">{copy.modal.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-subtle)]">
                {displayStatus?.totpEnabled ? copy.enabledHint : copy.subtitle}
              </p>

              <div className="mt-6 space-y-6">
                {displayStatus?.totpEnabled ? (
                  <div className="space-y-5">
                    <div className="rounded-lg border border-[color:var(--color-success-muted)] bg-[var(--color-success-muted)] p-4 text-sm text-[var(--color-success-foreground)]">
                      <p className="font-medium">{copy.successTitle}</p>
                      <p className="mt-1">{copy.successBody}</p>
                      <dl className="mt-3 grid gap-2 text-xs text-[var(--color-success-foreground)] sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold uppercase tracking-wide">{copy.status.issuedAt}</dt>
                          <dd>{formatTimestamp(displayStatus?.totpSecretIssuedAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold uppercase tracking-wide">{copy.status.confirmedAt}</dt>
                          <dd>{formatTimestamp(displayStatus?.totpConfirmedAt)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="space-y-3 rounded-lg border border-[color:var(--color-danger-muted)] bg-[var(--color-danger-muted)] p-4 text-sm text-[var(--color-danger-foreground)]">
                      <div>
                        <p className="font-semibold text-[var(--color-danger-foreground)]">{copy.disable.title}</p>
                        <p className="mt-1 text-[var(--color-danger-foreground)]">{copy.disable.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisable}
                        disabled={isDisabling}
                        className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-danger-muted)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-danger-foreground)] transition hover:border-[color:var(--color-danger)] hover:bg-[var(--color-danger-muted)] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isDisabling ? copy.disable.confirming : copy.disable.action}
                      </button>
                    </div>

                    {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="rounded-lg border border-[color:var(--color-warning-muted)] bg-[var(--color-warning-muted)] p-3 text-sm text-[var(--color-warning-foreground)]">
                      {hasPendingMfa ? copy.lockedMessage : copy.subtitle}
                    </p>

                    {lockoutActive ? (
                      <p className="rounded-lg border border-[color:var(--color-danger-muted)] bg-[var(--color-danger-muted)] p-3 text-sm text-[var(--color-danger-foreground)]">
                        {copy.errors.locked}
                        {lockoutLabel ? (
                          <span className="mt-1 block text-xs text-[var(--color-danger)]">{lockoutLabel}</span>
                        ) : null}
                      </p>
                    ) : null}

                    <ol className="space-y-4">
                      <li className="rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                        <h4 className="text-sm font-semibold text-[var(--color-text)]">{copy.guide.step1Title}</h4>
                        <p className="mt-2 text-sm text-[var(--color-text-subtle)]">{copy.guide.step1Description}</p>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-subtle)]">
                          <li>{copy.guide.step1Ios}</li>
                          <li>{copy.guide.step1Android}</li>
                        </ul>
                      </li>

                      <li className="rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                        <h4 className="text-sm font-semibold text-[var(--color-text)]">{copy.guide.step2Title}</h4>
                        <p className="mt-2 text-sm text-[var(--color-text-subtle)]">{copy.guide.step2Description}</p>
                        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
                          {qrCodeDataUrl ? (
                            <div className="flex justify-center lg:w-60 lg:justify-start">
                              <div className="rounded-xl border border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] p-3">
                                <div className="flex items-center justify-center rounded-lg border border-[color:var(--color-primary-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-sm)]">
                                  <Image
                                    src={qrCodeDataUrl}
                                    alt={copy.qrLabel}
                                    width={176}
                                    height={176}
                                    className="h-44 w-44"
                                    unoptimized
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null}
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.secretLabel}</p>
                              <code className="mt-1 block break-all rounded bg-[var(--color-primary-muted)] px-3 py-2 text-sm text-[var(--color-primary)]">{secret}</code>
                            </div>
                            {issuer ? (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.issuerLabel}</p>
                                <p className="mt-1 break-all text-sm text-[var(--color-text-subtle)]">{issuer}</p>
                              </div>
                            ) : null}
                            {accountLabel ? (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.accountLabel}</p>
                                <p className="mt-1 break-all text-sm text-[var(--color-text-subtle)]">{accountLabel}</p>
                              </div>
                            ) : null}
                            {uri ? (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.uriLabel}</p>
                                <a
                                  href={uri}
                                  className="mt-1 block break-all text-sm text-[var(--color-primary)] underline"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {uri}
                                </a>
                              </div>
                            ) : null}
                            <p className="text-xs text-[var(--color-text-subtle)] opacity-80">{copy.manualHint}</p>
                            <button
                              type="button"
                              onClick={handleProvision}
                              disabled={isProvisioning}
                              className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-primary-border)] px-3 py-2 text-xs font-medium text-[var(--color-primary)] transition hover:border-[color:var(--color-primary)] hover:bg-[var(--color-primary-muted)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isProvisioning ? `${copy.regenerate}…` : copy.regenerate}
                            </button>
                          </div>
                        </div>
                      </li>

                      <li className="rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                        <h4 className="text-sm font-semibold text-[var(--color-text)]">{copy.guide.step3Title}</h4>
                        <p className="mt-2 text-sm text-[var(--color-text-subtle)]">{copy.guide.step3Description}</p>
                        <form
                          onSubmit={handleVerify}
                          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
                        >
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-[var(--color-text-subtle)]" htmlFor="mfa-code-0">
                              {copy.codeLabel}
                            </label>
                            <div className="mt-2 flex gap-2 sm:gap-3">
                              {Array.from({ length: 6 }).map((_, index) => {
                                const digit = code[index] ?? ''
                                return (
                                  <input
                                    key={index}
                                    id={`mfa-code-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={digit}
                                    ref={(element) => {
                                      inputRefs.current[index] = element
                                    }}
                                    onChange={(event) => {
                                      const sanitized = event.target.value.replace(/\D/g, '')
                                      if (!sanitized) {
                                        setCode((prev) => {
                                          const digits = Array.from({ length: 6 }, (_, i) => prev[i] ?? '')
                                          digits[index] = ''
                                          return digits.join('')
                                        })
                                        return
                                      }

                                      const normalized = sanitized.slice(0, 6 - index)
                                      setCode((prev) => {
                                        const digits = Array.from({ length: 6 }, (_, i) => prev[i] ?? '')
                                        normalized.split('').forEach((value, offset) => {
                                          const targetIndex = index + offset
                                          if (targetIndex < 6) {
                                            digits[targetIndex] = value
                                          }
                                        })
                                        return digits.join('')
                                      })

                                      const nextIndex = Math.min(index + normalized.length, 5)
                                      if (nextIndex !== index) {
                                        setTimeout(() => {
                                          inputRefs.current[nextIndex]?.focus()
                                          inputRefs.current[nextIndex]?.select()
                                        }, 0)
                                      }
                                    }}
                                    onKeyDown={(event) => {
                                      const isDigit = /\d/.test(event.key)
                                      if (event.key === 'Backspace') {
                                        event.preventDefault()
                                        if (code[index]) {
                                          setCode((prev) => {
                                            const digits = Array.from({ length: 6 }, (_, i) => prev[i] ?? '')
                                            digits[index] = ''
                                            return digits.join('')
                                          })
                                        } else if (index > 0) {
                                          setCode((prev) => {
                                            const digits = Array.from({ length: 6 }, (_, i) => prev[i] ?? '')
                                            digits[index - 1] = ''
                                            return digits.join('')
                                          })
                                          setTimeout(() => {
                                            inputRefs.current[index - 1]?.focus()
                                          }, 0)
                                        }
                                        return
                                      }

                                      if (event.key === 'ArrowLeft' && index > 0) {
                                        event.preventDefault()
                                        inputRefs.current[index - 1]?.focus()
                                        return
                                      }

                                      if (event.key === 'ArrowRight' && index < 5) {
                                        event.preventDefault()
                                        inputRefs.current[index + 1]?.focus()
                                        return
                                      }

                                      if (event.key === 'Enter') {
                                        return
                                      }

                                      if (!isDigit && event.key.length === 1) {
                                        event.preventDefault()
                                      }
                                    }}
                                    onPaste={(event) => {
                                      const pasted = event.clipboardData?.getData('text') ?? ''
                                      const digitsOnly = pasted.replace(/\D/g, '').slice(0, 6)
                                      if (!digitsOnly) {
                                        return
                                      }
                                      event.preventDefault()
                                      setCode(digitsOnly)
                                      const targetIndex = Math.min(digitsOnly.length - 1, 5)
                                      setTimeout(() => {
                                        inputRefs.current[targetIndex]?.focus()
                                        inputRefs.current[targetIndex]?.select()
                                      }, 0)
                                    }}
                                    onFocus={(event) => event.currentTarget.select()}
                                    className="h-14 w-12 rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] text-center text-2xl font-mono text-[var(--color-text)] shadow-[var(--shadow-sm)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-muted)]"
                                  />
                                )
                              })}
                            </div>
                            <input
                              id="mfa-code"
                              name="code"
                              type="hidden"
                              value={code}
                              autoComplete="one-time-code"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isVerifying}
                            className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isVerifying ? copy.verifying : copy.verify}
                          </button>
                        </form>
                      </li>
                    </ol>

                    {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
                  </div>
                )}

                <div className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] p-4 text-xs text-[var(--color-text-subtle)]">
                  <p className="font-semibold text-[var(--color-text-subtle)]">{copy.actions.help}</p>
                  <p className="mt-1 text-[var(--color-text-subtle)]">{copy.actions.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-primary-border)] px-3 py-2 text-xs font-medium text-[var(--color-primary)] transition hover:border-[color:var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
                    >
                      {copy.actions.logout}
                    </button>
                    <a
                      href={copy.actions.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-[var(--color-primary-foreground)] transition hover:bg-[var(--color-primary-hover)]"
                    >
                      {copy.actions.docs}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
