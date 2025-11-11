'use client'

import { ChangeEvent, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useTenantAuthContext } from '@lib/mail/auth'

import MailDashboard from './MailDashboard'

const MAIL_DEMO_ENABLED =
  process.env.NEXT_PUBLIC_MAIL_DEMO === 'true' ||
  process.env.NEXT_PUBLIC_MAIL_DEMO === '1' ||
  process.env.NODE_ENV !== 'production'
const MAIL_DEMO_TENANT_ID = process.env.NEXT_PUBLIC_MAIL_DEMO_TENANT_ID ?? 'default'
const MAIL_DEMO_TENANT_NAME = process.env.NEXT_PUBLIC_MAIL_DEMO_TENANT_NAME ?? '演示租户'

export default function MailCenter() {
  const router = useRouter()
  const params = useSearchParams()
  const { tenants, defaultTenantId } = useTenantAuthContext()
  const queryTenantId = params.get('tenantId')
  const fallbackTenant = useMemo(
    () =>
      MAIL_DEMO_ENABLED && (!tenants || tenants.length === 0)
        ? { id: MAIL_DEMO_TENANT_ID, name: MAIL_DEMO_TENANT_NAME }
        : null,
    [tenants],
  )

  const tenantOptions = useMemo(() => {
    if (tenants && tenants.length > 0) {
      return tenants
    }
    return fallbackTenant ? [fallbackTenant] : []
  }, [fallbackTenant, tenants])

  const preferredTenantId = useMemo(() => {
    if (queryTenantId) {
      return queryTenantId
    }

    if (defaultTenantId && tenantOptions.some((tenant) => tenant.id === defaultTenantId)) {
      return defaultTenantId
    }

    return tenantOptions[0]?.id ?? null
  }, [defaultTenantId, queryTenantId, tenantOptions])

  useEffect(() => {
    if (!queryTenantId && preferredTenantId) {
      router.replace(`/panel/mail?tenantId=${preferredTenantId}`, { scroll: false })
    }
  }, [preferredTenantId, queryTenantId, router])

  const tenantId = queryTenantId ?? preferredTenantId

  const handleTenantChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value
      if (!value) {
        return
      }
      router.replace(`/panel/mail?tenantId=${value}`)
    },
    [router],
  )

  if (!tenantOptions.length) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] p-12 text-center text-[var(--color-text-subtle)] shadow-[var(--shadow-md)]">
        <p className="text-lg font-semibold text-[var(--color-heading)]">尚未加入任何租户</p>
        <p className="mt-2 max-w-md text-sm">联系管理员邀请你加入租户后即可在此处访问邮件中心。</p>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] p-12 text-center text-[var(--color-text-subtle)] shadow-[var(--shadow-md)]">
        <p className="text-lg font-semibold text-[var(--color-heading)]">选择要查看的租户邮箱</p>
        <select
          className="w-full max-w-xs rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
          onChange={handleTenantChange}
          defaultValue=""
        >
          <option value="" disabled>
            请选择租户
          </option>
          {tenantOptions.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name ?? tenant.id}
            </option>
          ))}
        </select>
      </div>
    )
  }

  const activeTenant = tenantOptions.find((tenant) => tenant.id === tenantId)
  const showDemoBanner = Boolean(fallbackTenant && tenantOptions.length === 1 && tenantOptions[0].id === fallbackTenant.id)

  return (
    <div className="flex flex-col gap-4">
      {showDemoBanner ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-primary-border)] bg-[var(--color-primary-muted)] px-5 py-4 text-sm text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
          <p className="font-semibold text-[var(--color-primary)]">演示模式</p>
          <p className="mt-1 text-[var(--color-primary)]/80">
            当前展示的是基于 docs/dashboard-mail-module-plan.md 的示例数据，用于本地预览邮件模块布局。
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-surface-border)] bg-[var(--color-surface-elevated)] px-5 py-4 shadow-[var(--shadow-md)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-[var(--color-heading)]">邮件中心</h1>
          <p className="text-sm text-[var(--color-text-subtle)]">多租户邮箱统一收件、AI 摘要与智能回复。</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-subtle)]">
          <span>当前租户</span>
          <select
            className="rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none"
            value={tenantId}
            onChange={handleTenantChange}
          >
            {tenantOptions.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name ?? tenant.id}
              </option>
            ))}
          </select>
        </label>
      </div>
      <MailDashboard tenantId={tenantId} tenantName={activeTenant?.name ?? fallbackTenant?.name ?? tenantId} />
    </div>
  )
}
