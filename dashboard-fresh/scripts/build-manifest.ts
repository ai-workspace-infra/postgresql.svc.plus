#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Build script to generate template manifest at build time
 * This replaces runtime template discovery with a pre-built manifest
 */

import { join } from '$std/path/mod.ts'
import { ensureDir, walk } from '$std/fs/mod.ts'

const OUTPUT_DIR = 'static/_build'
const OUTPUT_FILE = join(OUTPUT_DIR, 'template-manifest.json')

interface TemplateInfo {
  id: string
  path: string
  category?: string
  name?: string
}

async function discoverTemplates(): Promise<TemplateInfo[]> {
  const templates: TemplateInfo[] = []
  const templateDirs = ['cms/templates', 'src/templates']

  for (const dir of templateDirs) {
    try {
      for await (const entry of walk(dir, { exts: ['tsx', 'ts'], skip: [/test/i, /spec/i] })) {
        if (entry.isFile) {
          const relativePath = entry.path
          const id = relativePath
            .replace(/^(cms|src)\/templates\//, '')
            .replace(/\.(tsx|ts)$/, '')
            .replace(/\//g, '.')

          templates.push({
            id,
            path: `/${relativePath}`,
            name: id.split('.').pop() || id,
            category: id.split('.')[0] || 'default',
          })
        }
      }
    } catch (error) {
      console.warn(`[build-manifest] Skipping ${dir}:`, error.message)
    }
  }

  return templates
}

async function buildManifest() {
  console.log('[build-manifest] 🔨 Building template manifest...')

  await ensureDir(OUTPUT_DIR)

  const templates = await discoverTemplates()

  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    templates,
    count: templates.length,
  }

  await Deno.writeTextFile(OUTPUT_FILE, JSON.stringify(manifest, null, 2))

  console.log(
    `[build-manifest] ✓ Generated manifest with ${templates.length} templates`,
  )
  console.log(`[build-manifest] ✓ Output: ${OUTPUT_FILE}`)
}

if (import.meta.main) {
  try {
    await buildManifest()
  } catch (error) {
    console.error('[build-manifest] ✗ Failed:', error)
    Deno.exit(1)
  }
}
