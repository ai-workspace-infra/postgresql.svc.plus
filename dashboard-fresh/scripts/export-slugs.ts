#!/usr/bin/env -S deno run --allow-read --allow-write

import { join } from '$std/path/mod.ts'
import { ensureDir } from '$std/fs/mod.ts'

// Use import.meta to get the current directory
const scriptDir = new URL('.', import.meta.url).pathname
const projectRoot = new URL('..', import.meta.url).pathname
const OUTPUT_DIR = join(projectRoot, 'static/_build')

function unique<T>(items: Iterable<T>): T[] {
  return Array.from(new Set(items))
}

// Import types - these should be defined in your types directory
interface ProviderKey {
  key: string
  label: string
}

interface DirListing {
  path: string
  entries: unknown[]
}

/**
 * Build cloud IAC index from catalog
 * This would need to import your actual catalog data
 */
function buildCloudIacIndex() {
  // Placeholder - you'll need to import your actual CATALOG and PROVIDERS
  const providers: ProviderKey[] = []
  const services: Array<{ provider: string; service: string; category: string }> = []

  // TODO: Import and process actual catalog data
  console.log('[export-slugs] ℹ Cloud IAC catalog import needs implementation')

  return { providers, services }
}

/**
 * Load download manifest from static build directory
 */
async function loadDownloadManifest(): Promise<DirListing[]> {
  const manifestPath = join(projectRoot, 'static/_build/dl-index/all.json')
  try {
    const raw = await Deno.readTextFile(manifestPath)
    const parsed = JSON.parse(raw) as DirListing[]
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (error) {
    console.warn('[export-slugs] Unable to read download manifest:', error.message)
    return []
  }
}

/**
 * Extract download paths from listings
 */
function extractDownloadPaths(listings: DirListing[]): string[] {
  const paths: string[] = []
  for (const listing of listings) {
    if (!listing || typeof listing.path !== 'string') continue
    const trimmed = listing.path.replace(/\/+$/g, '')
    if (trimmed.length > 0) {
      paths.push(trimmed)
    }
  }
  return unique(paths).sort()
}

async function main() {
  console.log('[export-slugs] 🔨 Exporting slugs and paths...')

  await ensureDir(OUTPUT_DIR)

  const cloudIacIndex = buildCloudIacIndex()
  const downloadListings = await loadDownloadManifest()
  const downloadPaths = extractDownloadPaths(downloadListings)

  await Deno.writeTextFile(
    join(OUTPUT_DIR, 'cloud_iac_index.json'),
    JSON.stringify(cloudIacIndex, null, 2),
  )

  await Deno.writeTextFile(
    join(OUTPUT_DIR, 'docs_paths.json'),
    JSON.stringify(downloadPaths, null, 2),
  )

  console.log('[export-slugs] ✓ Exported slugs successfully')
  console.log(`[export-slugs]   - Cloud IAC index: ${cloudIacIndex.services.length} services`)
  console.log(`[export-slugs]   - Download paths: ${downloadPaths.length} paths`)
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    console.error('[export-slugs] ✗ Failed:', error)
    Deno.exit(1)
  }
}
