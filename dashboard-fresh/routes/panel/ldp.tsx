/**
 * LDP Page - Fresh + Deno
 *
 * LDP (Log Data Platform) panel page (extension-based)
 */

import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import { resolveExtensionRouteComponent } from '@/src/extensions/loader.ts'

interface LdpPageData {
  Component: any
}

export const handler: Handlers<LdpPageData, FreshState> = {
  async GET(_req, ctx) {
    try {
      const Component = await resolveExtensionRouteComponent('/panel/ldp')
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

export default function LdpPage({ data }: PageProps<LdpPageData>) {
  const { Component } = data
  return <Component />
}
