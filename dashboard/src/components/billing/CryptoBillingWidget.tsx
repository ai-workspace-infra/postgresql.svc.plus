'use client'

import { useMemo, useState } from 'react'

import type { BillingPaymentMethod } from '@modules/products/registry'

type CryptoBillingWidgetProps = {
  method: BillingPaymentMethod
  planName: string
  planId?: string
  kind: 'paygo' | 'subscription'
  productSlug?: string
  onRecord?: (payload: {
    externalId: string
    status?: string
    paymentQr?: string
    meta?: Record<string, unknown>
  }) => void
}

export default function CryptoBillingWidget({
  method,
  planName,
  planId,
  kind,
  productSlug,
  onRecord,
}: CryptoBillingWidgetProps) {
  const [copied, setCopied] = useState(false)

  const label = useMemo(() => method.label || method.type.toUpperCase(), [method.label, method.type])
  const address = method.address?.trim()
  const network = method.network?.trim()
  const qrCode = method.qrCode?.trim()

  const handleCopy = async () => {
    if (!address || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn('Failed to copy payment address', err)
    }
  }

  const handleRecord = () => {
    if (!onRecord) return
    const externalId = `${method.type}-${planId || kind}-${Date.now()}`
    onRecord({
      externalId,
      status: 'pending',
      paymentQr: qrCode,
      meta: {
        paymentMethod: method.type,
        address,
        network,
        instructions: method.instructions,
        planName,
        productSlug,
      },
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">{label}</p>
          {network ? <p className="text-xs text-slate-600">网络 / Network: {network}</p> : null}
        </div>
        {qrCode ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">扫码支付</span> : null}
      </div>

      {method.instructions ? (
        <p className="mt-2 text-sm text-slate-700">{method.instructions}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-700">扫码或复制地址完成支付后，点击同步到账户。</p>
      )}

      {address ? (
        <div className="mt-3 rounded-lg bg-white p-3 text-xs font-mono text-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate" title={address}>
              {address}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      ) : null}

      {qrCode ? (
        <div className="mt-3 rounded-lg bg-white p-3">
          <img src={qrCode} alt={`${label} QR`} className="mx-auto h-36 w-36 object-contain" />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRecord}
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          同步扫码订单
        </button>
      </div>
    </div>
  )
}
