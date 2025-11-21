'use client'

export function resolveBillingClientId(planClientId?: string) {
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
