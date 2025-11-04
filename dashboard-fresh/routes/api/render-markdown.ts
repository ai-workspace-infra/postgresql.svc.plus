/**
 * Render Markdown API Handler - Fresh + Deno
 *
 * GET /api/render-markdown?path=... - Render markdown file to HTML
 */

import { Handlers } from '$fresh/server.ts'
import { ContentNotFoundError, renderMarkdownFile } from '@/api/render-markdown.ts'

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
      const result = await renderMarkdownFile(path)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      if (error instanceof ContentNotFoundError) {
        return new Response(JSON.stringify({ error: 'Markdown file not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      console.error('Failed to render markdown:', error)
      return new Response(JSON.stringify({ error: 'Failed to render markdown' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
