/**
 * Management Page - Fresh + Deno
 *
 * User management panel page (extension-based)
 */

import { Handlers, PageProps } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'
import { resolveExtensionRouteComponent } from '@/src/extensions/loader.ts'

interface ManagementPageData {
  Component: any
}

export const handler: Handlers<ManagementPageData, FreshState> = {
  async GET(_req, ctx) {
    try {
      const Component = await resolveExtensionRouteComponent('/panel/management')
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

export default function ManagementPage({ data }: PageProps<ManagementPageData>) {
  const { Component } = data
  return <Component />
}
