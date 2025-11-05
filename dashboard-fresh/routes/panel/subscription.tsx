/**
 * Subscription Page - Fresh + Deno
 *
 * Subscription management panel page (extension-based)
 */

import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import { resolveExtensionRouteComponent } from '@/src/extensions/loader.ts'

interface SubscriptionPageData {
  Component: any
}

export const handler: Handlers<SubscriptionPageData, FreshState> = {
  async GET(_req, ctx) {
    try {
      const Component = await resolveExtensionRouteComponent('/panel/subscription')
      return ctx.render({ Component })
    } catch (error) {
      if (error instanceof Error && error.message.includes('disabled')) {
        // Extension is disabled, redirect to panel home
        return new Response('', {
          status: 302,
          headers: { Location: '/panel' },
        })
      }
      throw error
    }
  },
}

export default function SubscriptionPage({ data }: PageProps<SubscriptionPageData>) {
  const { Component } = data
  return <Component />
}
