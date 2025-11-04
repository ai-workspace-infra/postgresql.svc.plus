#!/usr/bin/env -S deno run --allow-read --allow-write

import { join } from '$std/path/mod.ts'
import { ensureDir, walk } from '$std/fs/mod.ts'

const projectRoot = new URL('..', import.meta.url).pathname
const CONTENT_DIR = join(projectRoot, 'cms/content')
const OUTPUT_DIR = join(projectRoot, 'static/_build')
const OUTPUT_FILE = join(OUTPUT_DIR, 'docs_index.json')

type DocEntry = {
  slug: string
  title: string
  description: string
  updatedAt: string
  pathSegments: string[]
}

/**
 * Extract title from markdown content
 */
function extractTitle(lines: string[], fallback: string): string {
  const heading = lines.find((line) => /^#\s+/.test(line))
  if (!heading) return fallback
  return heading.replace(/^#\s+/, '').trim() || fallback
}

/**
 * Extract description from markdown content
 */
function extractDescription(lines: string[], title: string): string {
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || /^#\s+/.test(trimmed)) {
      continue
    }
    return trimmed
  }
  return `${title}.`
}

/**
 * Read and parse a markdown file
 */
async function readMarkdownFile(filePath: string, relativePath: string): Promise<DocEntry | null> {
  if (!filePath.endsWith('.md')) return null

  const slug = relativePath.replace(/\.md$/, '').replace(/\\/g, '/')

  try {
    const [content, fileInfo] = await Promise.all([
      Deno.readTextFile(filePath),
      Deno.stat(filePath),
    ])

    const lines = content.split(/\r?\n/)
    const title = extractTitle(lines, slug)
    const description = extractDescription(lines, title)

    return {
      slug,
      title,
      description,
      updatedAt: fileInfo.mtime?.toISOString() || new Date().toISOString(),
      pathSegments: slug.split('/').filter(Boolean),
    }
  } catch (error) {
    console.warn(`[scan-md] Failed to read ${relativePath}:`, error.message)
    return null
  }
}

/**
 * Collect all documentation entries
 */
async function collectDocs(): Promise<DocEntry[]> {
  console.log(`[scan-md] 📂 Scanning ${CONTENT_DIR}...`)

  try {
    const entries: DocEntry[] = []

    for await (const entry of walk(CONTENT_DIR, {
      exts: ['.md'],
      skip: [/node_modules/, /_build/],
    })) {
      if (entry.isFile) {
        const relativePath = entry.path.replace(CONTENT_DIR + '/', '')
        const doc = await readMarkdownFile(entry.path, relativePath)
        if (doc) {
          entries.push(doc)
        }
      }
    }

    return entries.sort((a, b) => a.slug.localeCompare(b.slug))
  } catch (error) {
    console.warn('[scan-md] Unable to scan markdown directory:', error.message)
    return []
  }
}

async function main() {
  console.log('[scan-md] 🔨 Scanning markdown files...')

  await ensureDir(OUTPUT_DIR)

  const docs = await collectDocs()

  await Deno.writeTextFile(OUTPUT_FILE, JSON.stringify(docs, null, 2))

  console.log(`[scan-md] ✓ Scanned ${docs.length} markdown files`)
  console.log(`[scan-md] ✓ Output: ${OUTPUT_FILE}`)
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    console.error('[scan-md] ✗ Failed:', error)
    Deno.exit(1)
  }
}
