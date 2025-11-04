import { Handlers } from '$fresh/server.ts'
import { join } from '$std/path/mod.ts'

export const handler: Handlers = {
  async GET(_req) {
    try {
      const filePath = join(Deno.cwd(), 'static/_build/docs_index.json')
      const content = await Deno.readTextFile(filePath)
      const data = JSON.parse(content)

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      // Return empty docs index if file doesn't exist
      console.warn('Docs index not found, returning empty index:', error.message)
      return new Response(JSON.stringify({ docs: [], collections: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
