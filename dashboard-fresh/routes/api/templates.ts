import { Handlers } from '$fresh/server.ts'
import { join } from '$std/path/mod.ts'

const MANIFEST_PATH = join(Deno.cwd(), 'static', '_build', 'template-manifest.json')

async function loadManifest() {
  try {
    const content = await Deno.readTextFile(MANIFEST_PATH)
    return JSON.parse(content)
  } catch (error) {
    console.warn('Template manifest not found, returning empty manifest:', error.message)
    return {
      templates: [],
      stats: {
        total: 0,
        cms: 0,
        src: 0,
      },
      generatedAt: new Date().toISOString(),
    }
  }
}

export const handler: Handlers = {
  async GET(_req) {
    const manifest = await loadManifest()
    return new Response(JSON.stringify(manifest), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
