'use client'

import clsx from 'clsx'
import Link from 'next/link'
import type { MouseEvent, ReactNode } from 'react'

type SwitchAction = {
  text: string
  linkLabel: string
  href: string
}

export type AuthLayoutSocialButton = {
  label: string
  href: string
  icon: ReactNode
  disabled?: boolean
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

type AuthLayoutProps = {
  mode: 'login' | 'register'
  badge?: string
  title: string
  description?: string
  alert?: { type: 'error' | 'success'; message: string } | null
  socialHeading?: string
  socialButtons?: AuthLayoutSocialButton[]
  aboveForm?: ReactNode
  children: ReactNode
  footnote?: ReactNode
  bottomNote?: string
  switchAction: SwitchAction
}

function AuthLayoutTab({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5'
          : 'text-slate-500 hover:text-slate-700 focus-visible:text-slate-700',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}

function AuthSocialButton({ label, href, icon, disabled, onClick }: AuthLayoutSocialButton) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault()
      event.stopPropagation()
    }
    onClick?.(event)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={clsx(
        'flex items-center justify-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        disabled
          ? 'cursor-not-allowed bg-slate-100 text-slate-400 focus-visible:outline-slate-200'
          : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 focus-visible:outline-slate-900',
      )}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
    >
      {icon}
      {label}
    </a>
  )
}

export function AuthLayout({
  mode,
  badge,
  title,
  description,
  alert,
  socialHeading,
  socialButtons = [],
  aboveForm,
  children,
  footnote,
  bottomNote,
  switchAction,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <div
        className="pointer-events-none absolute inset-x-0 -top-1/3 h-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-transparent to-transparent"
        aria-hidden
      />
      <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-3xl font-semibold tracking-tight text-slate-900">
              Svc.Plus
            </Link>
            <p className="mt-1 text-sm text-slate-500">Cloud-Neutral · 自由中立</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-900/5 backdrop-blur">
            <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
              <AuthLayoutTab href="/login" active={mode === 'login'}>
                Sign In
              </AuthLayoutTab>
              <AuthLayoutTab href="/register" active={mode === 'register'}>
                Sign Up
              </AuthLayoutTab>
            </div>
            <div className="mt-6 space-y-6">
              {badge ? (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                  {badge}
                </span>
              ) : null}
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
                {description ? <p className="text-sm text-slate-600">{description}</p> : null}
              </div>
              {alert ? (
                <div
                  className={clsx(
                    'rounded-2xl border px-4 py-3 text-sm font-medium',
                    alert.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  )}
                >
                  {alert.message}
                </div>
              ) : null}
              {aboveForm}
              <div className="space-y-5">{children}</div>
              {socialButtons.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" aria-hidden />
                    {socialHeading ?? 'Or continue with'}
                    <span className="h-px flex-1 bg-slate-200" aria-hidden />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {socialButtons.map(button => (
                      <AuthSocialButton key={button.label} {...button} />
                    ))}
                  </div>
                </div>
              ) : null}
              <p className="text-sm text-slate-600">
                {switchAction.text}{' '}
                <Link href={switchAction.href} className="font-semibold text-sky-600 hover:text-sky-500">
                  {switchAction.linkLabel}
                </Link>
              </p>
              {footnote ? <div className="text-xs text-slate-400">{footnote}</div> : null}
            </div>
          </div>
          {bottomNote ? <p className="mt-6 text-center text-xs text-slate-500">{bottomNote}</p> : null}
        </div>
      </main>
    </div>
  )
}
