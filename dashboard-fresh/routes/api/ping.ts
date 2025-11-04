/**
 * Ping API Handler - Fresh + Deno
 *
 * GET /api/ping - Health check endpoint
 */

import { Handlers } from '$fresh/server.ts'

export const handler: Handlers = {
  GET(_req, _ctx) {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        runtime: 'deno',
        framework: 'fresh',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  },
}
