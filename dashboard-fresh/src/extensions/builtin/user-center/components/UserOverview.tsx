'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy } from 'lucide-react'

import { useLanguage } from '@i18n/LanguageProvider'
import { translations } from '@i18n/translations'
import { useUser } from '@lib/userStore'

import Card from './Card'
import VlessQrCard from './VlessQrCard'

function resolveDisplayName(
  user: {
    name?: string
    username: string
    email: string
  } | null,
) {
  if (!user) {
    return '访客'
  }

  if (user.name && user.name.trim().length > 0) {
    return user.name.trim()
  }

  if (user.username && user.username.trim().length > 0) {
    return user.username.trim()
  }

  return user.email
}

export default function UserOverview() {
  const router = useRouter()
  const { language } = useLanguage()
  const copy = translations[language].userCenter.overview
  const mfaCopy = translations[language].userCenter.mfa
  const { user, isLoading, logout } = useUser()
  const [copied, setCopied] = useState(false)

  const displayName = useMemo(() => resolveDisplayName(user), [user])
  const uuid = user?.uuid ?? user?.id ?? '—'
  const vlessUuid = user?.uuid ?? user?.id ?? null
  const username = user?.username ?? '—'
  const email = user?.email ?? '—'
  const docsUrl = mfaCopy.actions.docsUrl

  const mfaStatusLabel = useMemo(() => {
    if (user?.mfaEnabled) {
      return mfaCopy.state.enabled
    }
    if (user?.mfaPending) {
      return mfaCopy.state.pending
    }
    return mfaCopy.state.disabled
  }, [mfaCopy.state.disabled, mfaCopy.state.enabled, mfaCopy.state.pending, user?.mfaEnabled, user?.mfaPending])

  const requiresSetup = Boolean(user && (!user.mfaEnabled || user.mfaPending))

  const handleCopy = useCallback(async () => {
    const identifier = user?.uuid ?? user?.id
    if (!identifier) {
      return
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(identifier)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = identifier
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.warn('Failed to copy UUID', error)
    }
  }, [user?.id, user?.uuid])

  const handleGoToSetup = useCallback(() => {
    router.push('/panel/account?setupMfa=1')
  }, [router])

  const handleLogout = useCallback(async () => {
    await logout()
    router.replace('/login')
    router.refresh()
  }, [logout, router])

  return (
    <div className="space-y-6 text-[var(--color-text)] transition-colors">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-heading)]">{copy.heading}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-subtle)]">
          {isLoading
            ? copy.loading
            : user
              ? copy.welcome.replace('{name}', displayName)
              : copy.guest}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-subtle)] opacity-80">{copy.uuidNote}</p>
      </div>

      {requiresSetup ? (
        <div className="rounded-[var(--radius-xl)] border border-[color:var(--color-warning-muted)] bg-[var(--color-warning-muted)] p-4 text-sm text-[var(--color-warning-foreground)] transition-colors">
          <p className="text-base font-semibold">{copy.lockBanner.title}</p>
          <p className="mt-1 text-sm">{copy.lockBanner.body}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={handleGoToSetup}
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              {copy.lockBanner.action}
            </button>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-primary-border)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:border-[color:var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
            >
              {copy.lockBanner.docs}
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-[var(--color-warning-foreground)] transition-colors hover:bg-[var(--color-warning-muted)]"
            >
              {copy.lockBanner.logout}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.cards.uuid.label}</p>
              <p className="mt-1 break-all text-base font-medium text-[var(--color-text)]">{uuid}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!user?.id}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-surface-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-subtle)] transition-colors hover:border-[color:var(--color-primary-border)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:border-[color:var(--color-surface-border)] disabled:text-[var(--color-text-subtle)] opacity-100 disabled:opacity-60"
              aria-label={copy.cards.uuid.copy}
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? copy.cards.uuid.copied : copy.cards.uuid.copy}
            </button>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-subtle)]">{copy.cards.uuid.description}</p>
        </Card>

        <VlessQrCard uuid={vlessUuid} copy={copy.cards.vless} />

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.cards.username.label}</p>
          <p className="mt-1 text-base font-medium text-[var(--color-text)]">{username}</p>
          <p className="mt-3 text-xs text-[var(--color-text-subtle)]">{copy.cards.username.description}</p>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.cards.email.label}</p>
          <p className="mt-1 break-all text-base font-medium text-[var(--color-text)]">{email}</p>
          <p className="mt-3 text-xs text-[var(--color-text-subtle)]">{copy.cards.email.description}</p>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.cards.mfa.label}</p>
              <p className="mt-1 text-base font-medium text-[var(--color-text)]">{mfaStatusLabel}</p>
              <p className="mt-3 text-xs text-[var(--color-text-subtle)]">{copy.cards.mfa.description}</p>
            </div>
            <Link
              href="/panel/account?setupMfa=1"
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-primary-border)] px-3 py-1 text-xs font-medium text-[var(--color-primary)] transition-colors hover:border-[color:var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
            >
              {copy.cards.mfa.action}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
