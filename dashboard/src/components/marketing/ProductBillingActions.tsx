'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'

import { PayPalPayGoButton, PayPalSubscriptionButton } from '@components/billing/PayPalButtons'
import CryptoBillingWidget from '@components/billing/CryptoBillingWidget'
import type { BillingPaymentMethod, ProductConfig } from '@modules/products/registry'

function resolveClientId(planClientId?: string) {
  if (planClientId && planClientId.trim().length > 0) {
    return planClientId.trim()
  }
  if (typeof process !== 'undefined' && typeof process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID === 'string') {
    const candidate = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID.trim()
    if (candidate.length > 0) {
      return candidate
    }
  }
  if (typeof window !== 'undefined') {
    const globalCandidate = (window as typeof window & { __PAYPAL_CLIENT_ID__?: string }).__PAYPAL_CLIENT_ID__
    if (typeof globalCandidate === 'string' && globalCandidate.trim().length > 0) {
      return globalCandidate.trim()
    }
  }
  return ''
}

type ProductBillingActionsProps = {
  config: ProductConfig
  lang: 'zh' | 'en'
}

export default function ProductBillingActions({ config, lang }: ProductBillingActionsProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const billing = config.billing

  const clientId = useMemo(() => {
    return resolveClientId(billing?.saas?.clientId || billing?.paygo?.clientId)
  }, [billing?.paygo?.clientId, billing?.saas?.clientId])

  const handleSync = useCallback(
    async (payload: {
      externalId: string
      kind: string
      planId?: string
      status: string
      provider?: string
      paymentMethod?: string
      paymentQr?: string
      meta?: Record<string, unknown>
    }) => {
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

        setStatusMessage(lang === 'zh' ? '支付记录已同步到账户。' : 'Payment synced to your account.')
      } catch (error) {
        console.warn('Failed to sync subscription', error)
        setStatusMessage(lang === 'zh' ? '同步支付记录时出错。' : 'Failed to sync payment record.')
      }
    },
    [lang],
  )

  if (!billing) {
    return null
  }

  const paygo = billing.paygo
  const saas = billing.saas

  if (!paygo && !saas) {
    return null
  }

  return (
    <section id="billing" aria-labelledby="billing-title" className="bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="billing-title" className="text-2xl font-bold text-slate-900">
              {lang === 'zh' ? '支付与订阅' : 'Payments & Subscription'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {lang === 'zh'
                ? '直接在产品页面完成 PayPal / 以太坊 / USDT 支付与扫码，记录会同步到账户中心。'
                : 'Complete PayPal, Ethereum, or USDT checkout with QR support and keep records in your account.'}
            </p>
          </div>
          <div className="text-sm text-slate-700">
            {clientId
              ? lang === 'zh'
                ? '使用 PayPal / 以太坊 / USDT 安全结算与扫码'
                : 'PayPal, Ethereum, and USDT checkout with QR support'
              : lang === 'zh'
                ? '尚未配置 PayPal Client ID'
                : 'PayPal Client ID is not configured'}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {paygo ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">Pay-as-you-go</p>
                  <h3 className="text-xl font-semibold text-slate-900">{paygo.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{paygo.description}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {paygo.currency} {paygo.price.toFixed(2)}
                  </p>
                </div>
                <Link
                  href={`/${config.slug}#editions`}
                  className="text-sm font-medium text-brand hover:text-brand-dark"
                >
                  {lang === 'zh' ? '查看方案' : 'View editions'}
                </Link>
              </div>

              <div className="mt-4">
                <PayPalPayGoButton
                  clientId={clientId}
                  currency={paygo.currency}
                  amount={paygo.price}
                  description={paygo.description}
                  productSlug={config.slug}
                  planId={paygo.planId}
                  onApprove={(orderId, data) =>
                    handleSync({
                      externalId: orderId,
                      kind: 'paygo',
                      planId: paygo.planId,
                      status: 'active',
                      provider: 'paypal',
                      paymentMethod: 'paypal',
                      meta: { ...paygo.meta, product: config.slug, paypal: data },
                    })
                  }
                />

                {paygo.paymentMethods?.length ? (
                  <div className="mt-5 space-y-2">
                    <p className="text-sm font-medium text-slate-800">
                      {lang === 'zh'
                        ? '支持 PayPal / 以太坊 / USDT 扫码记录：'
                        : 'QR checkout for PayPal, Ethereum, and USDT:'}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {paygo.paymentMethods.map((method: BillingPaymentMethod) => (
                        <CryptoBillingWidget
                          key={`${paygo.planId}-${method.type}`}
                          method={method}
                          planId={paygo.planId}
                          planName={paygo.name}
                          kind="paygo"
                          productSlug={config.slug}
                          onRecord={(details) =>
                            handleSync({
                              externalId: details.externalId,
                              kind: 'paygo',
                              planId: paygo.planId,
                              status: details.status || 'pending',
                              provider: method.type,
                              paymentMethod: method.type,
                              paymentQr: details.paymentQr,
                              meta: { ...paygo.meta, ...details.meta, product: config.slug },
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {saas ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">SaaS</p>
                  <h3 className="text-xl font-semibold text-slate-900">{saas.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{saas.description}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {saas.currency} {saas.price.toFixed(2)} / {saas.interval ?? 'month'}
                  </p>
                </div>
                <Link
                  href={`/${config.slug}#editions`}
                  className="text-sm font-medium text-brand hover:text-brand-dark"
                >
                  {lang === 'zh' ? '订阅详情' : 'Subscription details'}
                </Link>
              </div>

              <div className="mt-4">
                <PayPalSubscriptionButton
                  clientId={clientId}
                  currency={saas.currency}
                  planId={saas.planId}
                  productSlug={config.slug}
                  onApprove={(subscriptionId, data) =>
                    handleSync({
                      externalId: subscriptionId,
                      kind: 'subscription',
                      planId: saas.planId,
                      status: 'active',
                      provider: 'paypal',
                      paymentMethod: 'paypal',
                      meta: { ...saas.meta, product: config.slug, paypal: data },
                    })
                  }
                />

                {saas.paymentMethods?.length ? (
                  <div className="mt-5 space-y-2">
                    <p className="text-sm font-medium text-slate-800">
                      {lang === 'zh'
                        ? '订阅也可通过 PayPal / 以太坊 / USDT 扫码：'
                        : 'Subscriptions via PayPal, Ethereum, or USDT QR codes:'}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {saas.paymentMethods.map((method: BillingPaymentMethod) => (
                        <CryptoBillingWidget
                          key={`${saas.planId}-${method.type}`}
                          method={method}
                          planId={saas.planId}
                          planName={saas.name}
                          kind="subscription"
                          productSlug={config.slug}
                          onRecord={(details) =>
                            handleSync({
                              externalId: details.externalId,
                              kind: 'subscription',
                              planId: saas.planId,
                              status: details.status || 'pending',
                              provider: method.type,
                              paymentMethod: method.type,
                              paymentQr: details.paymentQr,
                              meta: { ...saas.meta, ...details.meta, product: config.slug },
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {statusMessage ? (
          <p className="mt-6 text-sm text-brand-dark" role="status">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </section>
  )
}
