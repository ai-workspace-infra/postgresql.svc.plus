/** @jsxImportSource preact */
/**
 * AuthLayout Component - Fresh + Preact
 *
 * Layout wrapper for authentication pages (login/register)
 * Migrated from Next.js to preserve original design
 */

import { ComponentChildren } from 'preact'
import { clsx } from 'clsx'

type SwitchAction = {
  text: string
  linkLabel: string
  href: string
}

export type AuthLayoutSocialButton = {
  label: string
  href: string
  icon: ComponentChildren
  disabled?: boolean
  onClick?: (event: MouseEvent) => void
}

type AlertType = 'error' | 'success' | 'info'

type AuthLayoutProps = {
  mode: 'login' | 'register'
  badge?: string
  title: string
  description?: string
  alert?: { type: AlertType; message: string } | null
  socialHeading?: string
  socialButtons?: AuthLayoutSocialButton[]
  aboveForm?: ComponentChildren
  children: ComponentChildren
  footnote?: ComponentChildren
  bottomNote?: string
  switchAction: SwitchAction
}

function AuthLayoutTab({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ComponentChildren
}) {
  return (
    <a
      href={href}
      class={clsx(
        'flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5'
          : 'text-slate-500 hover:text-slate-700 focus-visible:text-slate-700'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </a>
  )
}

function AuthSocialButton({ label, href, icon, disabled, onClick }: AuthLayoutSocialButton) {
  const handleClick = (event: MouseEvent) => {
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
      class={clsx(
        'flex items-center justify-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        disabled
          ? 'cursor-not-allowed bg-slate-100 text-slate-400 focus-visible:outline-slate-200'
          : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 focus-visible:outline-slate-900'
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
    <div class="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <div
        class="pointer-events-none absolute inset-x-0 -top-1/3 h-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-transparent to-transparent"
        aria-hidden="true"
      />
      <main
        class="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
        data-testid="auth-layout"
      >
        <div class="w-full max-w-md">
          <div class="mb-8 text-center">
            <a href="/" class="text-3xl font-semibold tracking-tight text-slate-900">
              CloudNative Suite
            </a>
            <p class="mt-1 text-sm text-slate-500">云原生套件 · Cloud-Neutral</p>
          </div>
          <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-900/5 backdrop-blur">
            <div class="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
              <AuthLayoutTab href="/login" active={mode === 'login'}>
                Sign In
              </AuthLayoutTab>
              <AuthLayoutTab href="/register" active={mode === 'register'}>
                Sign Up
              </AuthLayoutTab>
            </div>
            <div class="mt-6 space-y-6">
              {badge && (
                <span class="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                  {badge}
                </span>
              )}
              <div class="space-y-2">
                <h1 class="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
                {description && <p class="text-sm text-slate-600">{description}</p>}
              </div>
              {alert && (
                <div
                  class={clsx(
                    'rounded-2xl border px-4 py-3 text-sm font-medium',
                    alert.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : alert.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-sky-200 bg-sky-50 text-sky-700'
                  )}
                  role="status"
                  aria-live="polite"
                >
                  {alert.message}
                </div>
              )}
              {aboveForm}
              <div class="space-y-5">{children}</div>
              {socialButtons.length > 0 && (
                <div class="space-y-4">
                  <div class="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span class="h-px flex-1 bg-slate-200" aria-hidden="true" />
                    {socialHeading ?? 'Or continue with'}
                    <span class="h-px flex-1 bg-slate-200" aria-hidden="true" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    {socialButtons.map((button) => (
                      <AuthSocialButton key={button.label} {...button} />
                    ))}
                  </div>
                </div>
              )}
              <p class="text-sm text-slate-600">
                {switchAction.text}{' '}
                <a href={switchAction.href} class="font-semibold text-sky-600 hover:text-sky-500">
                  {switchAction.linkLabel}
                </a>
              </p>
              {footnote && <div class="text-xs text-slate-400">{footnote}</div>}
            </div>
          </div>
          {bottomNote && <p class="mt-6 text-center text-xs text-slate-500">{bottomNote}</p>}
        </div>
      </main>
    </div>
  )
}
