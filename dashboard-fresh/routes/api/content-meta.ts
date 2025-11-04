/**
 * Content Metadata API Handler - Fresh + Deno
 *
 * GET /api/content-meta?path=... - Get git metadata for content file
 */

import { Handlers } from '$fresh/server.ts'
import { ContentNotFoundError, getContentCommitMeta } from '@/api/content-meta.ts'

export const handler: Handlers = {
  async GET(req, _ctx) {
    const url = new URL(req.url)
    const path = url.searchParams.get('path')

    if (!path) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const result = await getContentCommitMeta(path)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      if (error instanceof ContentNotFoundError) {
        return new Response(JSON.stringify({ error: 'Content file not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      console.error('Failed to load content metadata:', error)
      return new Response(JSON.stringify({ error: 'Failed to load metadata' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
