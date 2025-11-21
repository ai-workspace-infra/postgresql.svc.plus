'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

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

type ProductOption = {
  product: ProductConfig
  plan: BillingPlan
  kind: 'paygo' | 'subscription'
  clientId: string
}

const kindLabel: Record<'paygo' | 'subscription', string> = {
  paygo: 'PAY-AS-YOU-GO',
  subscription: 'SAAS',
}

const actionLabel: Record<'paygo' | 'subscription', string> = {
  paygo: '立即购买',
  subscription: '立即订阅',
}

const methodHints: Record<BillingPaymentMethod['type'], string> = {
  paypal: '建议使用 PayPal App 扫码，支付成功后系统自动确认订单。',
  ethereum: '使用以太坊（ERC20）转账，支付后订单会自动识别并激活。',
  usdt: '使用 USDT（TRC20）转账，支付完成后自动续订或开通。',
}

export default function BillingOptionsPanel() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProductOption | null>(null)
  const primaryButtonClass =
    'inline-flex w-full items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-strong)]'
  const qrClassName = 'mx-auto h-56 w-56 object-contain'
  const paymentCardClass =
    'flex h-full flex-col gap-4 rounded-2xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface)] p-5 shadow-sm'

  const products = useMemo(
    () => PRODUCT_LIST.filter((item) => item.billing && (item.billing.paygo || item.billing.saas)),
    [],
  )

  const productOptions = useMemo(() => {
    const options: ProductOption[] = []

    products.forEach((product) => {
      const paygo = product.billing?.paygo
      const saas = product.billing?.saas
      const clientId = resolveBillingClientId(saas?.clientId || paygo?.clientId)

      if (paygo) {
        options.push({ product, plan: paygo, kind: 'paygo', clientId })
      }

      if (saas) {
        options.push({ product, plan: saas, kind: 'subscription', clientId })
      }
    })

    return options
  }, [products])

  useEffect(() => {
    if (!selected && productOptions.length) {
      setSelected(productOptions[0])
    }
  }, [productOptions, selected])

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

  const activeMethods = useMemo(() => {
    if (!selected?.plan.paymentMethods) return []
    const order: BillingPaymentMethod['type'][] = ['paypal', 'ethereum', 'usdt']
    return order
      .map((type) => selected.plan.paymentMethods?.find((method) => method.type === type))
      .filter(Boolean) as BillingPaymentMethod[]
  }, [selected?.plan.paymentMethods])

  const handleCryptoRecord = useCallback(
    (method: BillingPaymentMethod) => {
      if (!selected) return
      const externalId = `${method.type}-${selected.plan.planId || selected.kind}-${Date.now()}`

      handleSync({
        externalId,
        kind: selected.kind,
        planId: selected.plan.planId,
        status: 'pending',
        provider: method.type,
        paymentMethod: method.type,
        paymentQr: method.qrCode,
        meta: {
          ...selected.plan.meta,
          product: selected.product.slug,
          paymentMethod: method.type,
          address: method.address,
          network: method.network,
          instructions: method.instructions,
        },
      })
    },
    [handleSync, selected],
  )

  const renderCryptoCard = (method: BillingPaymentMethod) => {
    const address = method.address?.trim()
    const network = method.network?.trim()
    const qrCode = method.qrCode?.trim()

    return (
      <div key={`${selected?.plan.planId}-${method.type}`} className={paymentCardClass}>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{method.label || method.type}</p>
          <p className="text-lg font-semibold text-[var(--color-heading)]">{method.type === 'ethereum' ? 'ETH（ERC20）' : 'USDT（TRC20）'}</p>
          <p className="text-sm text-[var(--color-text-subtle)]">{methodHints[method.type]}</p>
        </div>

        {qrCode ? (
          <div className="rounded-xl bg-white p-4 text-center">
            <img src={qrCode} alt={`${method.label || method.type} QR`} className={qrClassName} />
          </div>
        ) : null}

        {address ? (
          <div className="space-y-2 rounded-xl bg-[color:var(--color-surface-muted)] p-3 text-xs text-[var(--color-text)]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[color:var(--color-heading)]">钱包地址</span>
              {network ? (
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[color:var(--color-heading)]">
                  {network}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/60 p-2">
              <span className="flex-1 truncate font-mono" title={address}>
                {address}
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!navigator.clipboard?.writeText) return
                  await navigator.clipboard.writeText(address)
                  setStatusMessage('已复制钱包地址，完成支付后订单将自动识别。')
                }}
                className="inline-flex items-center rounded-md bg-white px-3 py-1 text-[11px] font-semibold text-[color:var(--color-heading)] shadow-sm transition-colors hover:bg-[color:var(--color-surface)]"
              >
                复制
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => handleCryptoRecord(method)} className={primaryButtonClass}>
            使用此方式支付
          </button>
        </div>
      </div>
    )
  }

  const renderPayPalCard = (method: BillingPaymentMethod) => {
    if (!selected) return null

    return (
      <div className={paymentCardClass}>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">PayPal</p>
          <p className="text-lg font-semibold text-[var(--color-heading)]">PayPal 扫码</p>
          <p className="text-sm text-[var(--color-text-subtle)]">{methodHints.paypal}</p>
        </div>

        {method.qrCode ? (
          <div className="rounded-xl bg-white p-4 text-center">
            <img src={method.qrCode} alt="PayPal QR" className={qrClassName} />
          </div>
        ) : null}

        <div className="mt-auto space-y-2">
          <div className="rounded-lg border border-[color:var(--color-surface-border)] bg-white p-3 text-center">
            {selected.kind === 'paygo' ? (
              <PayPalPayGoButton
                clientId={selected.clientId}
                currency={selected.plan.currency}
                amount={selected.plan.price}
                description={selected.plan.description}
                productSlug={selected.product.slug}
                planId={selected.plan.planId}
                onApprove={(orderId, data) =>
                  handleSync({
                    externalId: orderId,
                    kind: selected.kind,
                    planId: selected.plan.planId,
                    status: 'active',
                    provider: 'paypal',
                    paymentMethod: 'paypal',
                    meta: { ...selected.plan.meta, product: selected.product.slug, paypal: data },
                  })
                }
              />
            ) : (
              <PayPalSubscriptionButton
                clientId={selected.clientId}
                currency={selected.plan.currency}
                planId={selected.plan.planId}
                productSlug={selected.product.slug}
                onApprove={(subscriptionId, data) =>
                  handleSync({
                    externalId: subscriptionId,
                    kind: selected.kind,
                    planId: selected.plan.planId,
                    status: 'active',
                    provider: 'paypal',
                    paymentMethod: 'paypal',
                    meta: { ...selected.plan.meta, product: selected.product.slug, paypal: data },
                  })
                }
              />
            )}
          </div>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => setStatusMessage('正在使用 PayPal 支付，完成后系统会自动同步订单。')}
          >
            使用此方式支付
          </button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3 flex-col md:flex-row md:items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Product Mode</p>
            <h2 className="text-xl font-semibold text-[color:var(--color-heading)]">先选产品模式，再挑支付方式</h2>
            <p className="text-sm text-[var(--color-text-subtle)]">
              PAY-AS-YOU-GO（流量包）与 SaaS 订阅并排展示，信息分层更清晰，避免混淆。
            </p>
            <p className="text-xs font-semibold text-[var(--color-heading)]">
              扫码支付 → 系统自动识别付款 → 自动激活 / 续订订单。
            </p>
          </div>
          {selected?.clientId ? (
            <p className="rounded-full bg-[color:var(--color-surface-muted)] px-4 py-2 text-xs font-semibold text-[var(--color-heading)]">
              PayPal / 加密货币均已启用
            </p>
          ) : (
            <p className="rounded-full bg-[color:var(--color-surface-muted)] px-4 py-2 text-xs font-semibold text-[var(--color-heading)]">
              尚未配置 PayPal Client ID
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {productOptions.map((option) => {
            const isActive =
              selected !== null && selected.plan.planId === option.plan.planId && selected.kind === option.kind
            const isSubscription = option.kind === 'subscription'
            const description = isSubscription
              ? '全节点加速 + AI 网络优化。自动续费，可随时取消。'
              : '一次购买可叠加，不自动续费。'
            return (
              <div
                key={`${option.product.slug}-${option.kind}`}
                className={`flex h-full flex-col gap-3 rounded-2xl border p-5 shadow-sm transition-colors ${
                  isActive
                    ? 'border-[color:var(--color-primary)] bg-[color:var(--color-surface)]'
                    : 'border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-muted)] hover:border-[color:var(--color-primary)]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                        {kindLabel[option.kind]}
                      </p>
                      <h4 className="text-lg font-semibold text-[var(--color-heading)]">{option.plan.name}</h4>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[color:var(--color-heading)]">
                      {isSubscription ? '自动续费' : '一次性购买'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-subtle)]">{description}</p>
                  <p className="text-2xl font-bold text-[var(--color-heading)]">
                    {option.plan.currency} {option.plan.price.toFixed(0)}
                    {isSubscription && option.plan.interval ? ` / ${option.plan.interval}` : ''}
                  </p>
                </div>
                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={() => setSelected(option)}
                    className={`${
                      isActive
                        ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)]'
                        : 'bg-white text-[var(--color-heading)] hover:bg-[color:var(--color-surface)]'
                    } inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-colors`}
                  >
                    {actionLabel[option.kind]}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {selected ? (
          <div className="space-y-4 rounded-2xl border border-[color:var(--color-surface-border)] bg-[color:var(--color-surface-muted)] p-5">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Payment</p>
              <h3 className="text-lg font-semibold text-[var(--color-heading)]">三种扫码支付并列，统一卡片结构</h3>
              <p className="text-sm text-[var(--color-text-subtle)]">
                标准流程：扫码支付 → 系统自动识别付款 → 自动激活 / 续订订单。二维码统一尺寸，地址区使用等宽字体并提供复制按钮。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {activeMethods.map((method) =>
                method.type === 'paypal' ? renderPayPalCard(method) : renderCryptoCard(method),
              )}
            </div>
          </div>
        ) : null}

        {statusMessage ? <p className="text-sm text-[var(--color-primary)]">{statusMessage}</p> : null}
      </div>
    </Card>
  )
}
