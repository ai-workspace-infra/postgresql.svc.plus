'use client'

import { useCallback, useMemo, useState } from 'react'

import CryptoBillingWidget from '@components/billing/CryptoBillingWidget'
import { PayPalPayGoButton, PayPalSubscriptionButton } from '@components/billing/PayPalButtons'
import { resolveBillingClientId } from '@components/billing/utils'
import Card from '../components/Card'
import type { BillingPaymentMethod, BillingPlan, ProductConfig } from '@modules/products/registry'
import { PRODUCT_LIST } from '@modules/products/registry'

type SyncPayload = {
  externalId: string
  kind: string
  planId?: string
  status: string
  provider?: string
  paymentMethod?: string
  paymentQr?: string
  meta?: Record<string, unknown>
}

type BillingOptionProps = {
  plan: BillingPlan
  kind: 'paygo' | 'subscription'
  clientId: string
  product: ProductConfig
  onSync: (payload: SyncPayload) => Promise<void>
}

function BillingOption({ plan, kind, clientId, product, onSync }: BillingOptionProps) {
  return (
    <div className="rounded-xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            {kind === 'paygo' ? 'Pay-as-you-go' : 'SaaS'}
          </p>
          <h3 className="text-lg font-semibold text-[var(--color-heading)]">{plan.name}</h3>
          {plan.description ? (
            <p className="mt-1 text-sm text-[var(--color-text-subtle)]">{plan.description}</p>
          ) : null}
          <p className="mt-2 text-lg font-bold text-[var(--color-heading)]">
            {plan.currency} {plan.price.toFixed(2)}
            {kind === 'subscription' && plan.interval ? ` / ${plan.interval}` : null}
          </p>
        </div>
        <div className="text-right text-xs text-[var(--color-text-subtle)]">
          {clientId ? 'PayPal / ETH / USDT 结算' : '尚未配置 PayPal Client ID'}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-[color:var(--color-surface-border)] bg-white p-3">
          {kind === 'paygo' ? (
            <PayPalPayGoButton
              clientId={clientId}
              currency={plan.currency}
              amount={plan.price}
              description={plan.description}
              productSlug={product.slug}
              planId={plan.planId}
              onApprove={(orderId, data) =>
                onSync({
                  externalId: orderId,
                  kind,
                  planId: plan.planId,
                  status: 'active',
                  provider: 'paypal',
                  paymentMethod: 'paypal',
                  meta: { ...plan.meta, product: product.slug, paypal: data },
                })
              }
            />
          ) : (
            <PayPalSubscriptionButton
              clientId={clientId}
              currency={plan.currency}
              planId={plan.planId}
              productSlug={product.slug}
              onApprove={(subscriptionId, data) =>
                onSync({
                  externalId: subscriptionId,
                  kind,
                  planId: plan.planId,
                  status: 'active',
                  provider: 'paypal',
                  paymentMethod: 'paypal',
                  meta: { ...plan.meta, product: product.slug, paypal: data },
                })
              }
            />
          )}
        </div>

        {plan.paymentMethods?.length ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-heading)]">
              {kind === 'paygo' ? '扫码付款' : '扫码订阅'}（PayPal / 以太坊 / USDT）
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {plan.paymentMethods.map((method: BillingPaymentMethod) => (
                <CryptoBillingWidget
                  key={`${plan.planId}-${method.type}`}
                  method={method}
                  planId={plan.planId}
                  planName={plan.name}
                  kind={kind}
                  productSlug={product.slug}
                  onRecord={(details) =>
                    onSync({
                      externalId: details.externalId,
                      kind,
                      planId: plan.planId,
                      status: details.status || 'pending',
                      provider: method.type,
                      paymentMethod: method.type,
                      paymentQr: details.paymentQr,
                      meta: { ...plan.meta, ...details.meta, product: product.slug },
                    })
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function BillingOptionsPanel() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const products = useMemo(
    () => PRODUCT_LIST.filter((item) => item.billing && (item.billing.paygo || item.billing.saas)),
    [],
  )

  const handleSync = useCallback(async (payload: SyncPayload) => {
    try {
      setStatusMessage(null)
      const response = await fetch('/api/auth/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: payload.provider || 'paypal',
          paymentMethod: payload.paymentMethod || payload.provider || 'paypal',
          paymentQr: payload.paymentQr,
          ...payload,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setStatusMessage((data?.message as string) || '同步支付信息失败，请稍后重试。')
        return
      }

      setStatusMessage('支付记录已同步到账户。')
    } catch (error) {
      console.warn('Failed to sync subscription', error)
      setStatusMessage('同步支付记录时出错。')
    }
  }, [])

  if (!products.length) {
    return null
  }

  return (
    <Card>
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">支付与订阅</p>
          <h2 className="text-xl font-semibold text-[var(--color-heading)]">完成订阅并同步到账户</h2>
          <p className="text-sm text-[var(--color-text-subtle)]">
            支持 PayPal、以太坊与 USDT 的扫码或直连支付，订单会实时同步到下方的订阅列表。
          </p>
        </div>
        {statusMessage ? <p className="text-sm text-[var(--color-primary)]">{statusMessage}</p> : null}
      </div>

      <div className="mt-4 space-y-6">
        {products.map((product) => {
          const paygo = product.billing?.paygo
          const saas = product.billing?.saas
          const clientId = resolveBillingClientId(saas?.clientId || paygo?.clientId)

          return (
            <div key={product.slug} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-primary)]">{product.name}</p>
                  <h3 className="text-lg font-semibold text-[var(--color-heading)]">{product.title}</h3>
                  <p className="text-sm text-[var(--color-text-subtle)]">{product.tagline_zh}</p>
                </div>
                <p className="text-xs text-[var(--color-text-subtle)]">
                  {clientId ? '已启用 PayPal 结算' : '尚未配置 PayPal Client ID'}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {paygo ? (
                  <BillingOption plan={paygo} kind="paygo" clientId={clientId} product={product} onSync={handleSync} />
                ) : null}
                {saas ? (
                  <BillingOption
                    plan={saas}
                    kind="subscription"
                    clientId={clientId}
                    product={product}
                    onSync={handleSync}
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
