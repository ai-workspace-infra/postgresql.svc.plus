'use client'

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'

declare global {
  interface Window {
    paypal?: {
      Buttons: (...args: any[]) => any
    }
  }
}

type PayPalNamespace = NonNullable<typeof window.paypal>

type PayPalButtonsComponent = ReturnType<NonNullable<PayPalNamespace>['Buttons']>

type PayPalButtonsRenderOptions = Parameters<NonNullable<PayPalNamespace>['Buttons']>[0]

type PayPalOrderActions = {
  order: {
    create: (config: {
      purchase_units: Array<{
        description: string
        invoice_id?: string
        custom_id?: string
        amount: { currency_code: string; value: string }
      }>
    }) => Promise<string> | string
    capture: () => Promise<Record<string, unknown>>
  }
}

type PayPalSubscriptionActions = {
  subscription: {
    create: (config: { plan_id: string; custom_id?: string }) => Promise<string> | string
  }
}

type PayPalPayGoButtonProps = {
  clientId?: string
  currency?: string
  amount: number
  description?: string
  productSlug?: string
  planId?: string
  onApprove?: (orderId: string, data?: Record<string, unknown>) => void
}

type PayPalSubscriptionButtonProps = {
  clientId?: string
  currency?: string
  planId: string
  productSlug?: string
  onApprove?: (subscriptionId: string, data?: Record<string, unknown>) => void
}

function loadPayPalSdk(clientId?: string, currency?: string): Promise<PayPalNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PayPal SDK can only be loaded in the browser'))
  }

  if (!clientId) {
    return Promise.reject(new Error('PayPal client id is not configured'))
  }

  if (window.paypal) {
    return Promise.resolve(window.paypal)
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk]')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.paypal) {
          resolve(window.paypal)
        } else {
          reject(new Error('PayPal SDK failed to initialize'))
        }
      })
      existingScript.addEventListener('error', () => reject(new Error('PayPal SDK failed to load')))
      return
    }

    const params = new URLSearchParams({ 'client-id': clientId, intent: 'subscription', vault: 'true' })
    if (currency) {
      params.set('currency', currency)
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.dataset.paypalSdk = 'true'

    script.onload = () => {
      if (window.paypal) {
        resolve(window.paypal)
      } else {
        reject(new Error('PayPal SDK failed to initialize'))
      }
    }
    script.onerror = () => reject(new Error('PayPal SDK failed to load'))

    document.head.appendChild(script)
  })
}

function usePayPalButtons(
  options: PayPalButtonsRenderOptions | null,
  clientId?: string,
  currency?: string,
): { ref: RefObject<HTMLDivElement>; error: string | null; isReady: boolean } {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setReady] = useState(false)

  useEffect(() => {
    let instance: PayPalButtonsComponent | undefined

    if (!options) {
      return
    }

    loadPayPalSdk(clientId, currency)
      .then((paypal) => {
        instance = paypal.Buttons(options)
        setReady(true)
        if (containerRef.current) {
          instance.render(containerRef.current)
        }
      })
      .catch((err: Error) => {
        setError(err.message)
      })

    return () => {
      if (instance) {
        instance.close().catch(() => null)
      }
    }
  }, [clientId, currency, options])

  return { ref: containerRef, error, isReady }
}

export function PayPalPayGoButton({
  clientId,
  currency = 'USD',
  amount,
  description,
  planId,
  productSlug,
  onApprove,
}: PayPalPayGoButtonProps) {
  const options = useMemo<PayPalButtonsRenderOptions | null>(() => {
    if (!clientId || amount <= 0) {
      return null
    }

    return {
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
      },
      createOrder: (_data: Record<string, unknown>, actions: PayPalOrderActions) => {
        return actions.order.create({
          purchase_units: [
            {
              description: description || 'Usage purchase',
              invoice_id: planId || undefined,
              custom_id: productSlug || undefined,
              amount: {
                currency_code: currency,
                value: amount.toFixed(2),
              },
            },
          ],
        })
      },
      onApprove: (data: { orderID?: string }, actions: Partial<PayPalOrderActions>) => {
        if (actions.order) {
          return actions.order.capture().then((details) => {
            onApprove?.(data.orderID ?? 'unknown', details as unknown as Record<string, unknown>)
          })
        }

        onApprove?.(data.orderID ?? 'unknown', data as unknown as Record<string, unknown>)
        return undefined
      },
    }
  }, [amount, clientId, currency, description, onApprove, planId, productSlug])

  const { ref, error, isReady } = usePayPalButtons(options, clientId, currency)

  return (
    <div className="space-y-2">
      <div ref={ref} aria-busy={!isReady && !error} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export function PayPalSubscriptionButton({
  clientId,
  currency = 'USD',
  planId,
  productSlug,
  onApprove,
}: PayPalSubscriptionButtonProps) {
  const options = useMemo<PayPalButtonsRenderOptions | null>(() => {
    if (!clientId || !planId) {
      return null
    }

    return {
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'subscribe',
      },
      createSubscription: (_data: Record<string, unknown>, actions: PayPalSubscriptionActions) => {
        return actions.subscription.create({
          plan_id: planId,
          custom_id: productSlug,
        })
      },
      onApprove: (
        data: { subscriptionID?: string; orderID?: string },
        _actions: unknown,
      ) => {
        onApprove?.(data.subscriptionID ?? data.orderID ?? 'unknown', data as unknown as Record<string, unknown>)
      },
    }
  }, [clientId, onApprove, planId, productSlug])

  const { ref, error, isReady } = usePayPalButtons(options, clientId, currency)

  return (
    <div className="space-y-2">
      <div ref={ref} aria-busy={!isReady && !error} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
