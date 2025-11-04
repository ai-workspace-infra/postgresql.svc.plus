import { Handlers } from '$fresh/server.ts'
import { join } from '$std/path/mod.ts'

export const handler: Handlers = {
  async GET(_req) {
    try {
      const filePath = join(Deno.cwd(), 'static/_build/dl-index/all.json')
      const content = await Deno.readTextFile(filePath)
      const data = JSON.parse(content)

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      // Return empty downloads index if file doesn't exist
      console.warn('Downloads index not found, returning empty index:', error.message)
      return new Response(JSON.stringify({ downloads: [], categories: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
