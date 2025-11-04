#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env

import { join } from '$std/path/mod.ts'
import { ensureDir } from '$std/fs/mod.ts'

const projectRoot = new URL('..', import.meta.url).pathname
const OUTPUT_DIR = join(projectRoot, 'static/_build/dl-index')

// Types for download index
interface DirEntry {
  name: string
  type: 'file' | 'dir'
  lastModified?: string
  size?: number
}

interface DirListing {
  path: string
  entries: DirEntry[]
}

interface Section {
  key: string
  title: string
  href: string
  lastModified?: string
  count?: number
}

const BASE = (Deno.env.get('DL_BASE') || 'https://dl.svc.plus/').replace(/\/+$/, '') + '/'

/**
 * Recursively crawl download directory structure
 */
async function crawl(rel: string): Promise<DirListing[]> {
  const url = BASE + rel
  try {
    const res = await fetch(url + 'index.json')
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)

    const entries = (await res.json()) as DirEntry[]
    const listing: DirListing = { path: rel, entries }
    const all: DirListing[] = [listing]

    for (const e of entries) {
      if (e.type === 'dir') {
        const childRel = rel + e.name + '/'
        const child = await crawl(childRel)
        all.push(...child)
      }
    }

    return all
  } catch (error) {
    console.warn(`[fetch-dl-index] Failed to crawl ${url}:`, error.message)
    return []
  }
}

async function main() {
  console.log('[fetch-dl-index] 🔨 Fetching download index...')
  console.log(`[fetch-dl-index] 📍 Base URL: ${BASE}`)

  const listings = await crawl('')
  const top = listings.find((l) => l.path === '')
  const sections: Section[] = top
    ? top.entries
      .filter((e) => e.type === 'dir')
      .map((e) => ({
        key: e.name,
        title: e.name,
        href: '/' + e.name + '/',
        lastModified: e.lastModified,
        count: undefined,
      }))
    : []

  await ensureDir(OUTPUT_DIR)
  await Deno.writeTextFile(join(OUTPUT_DIR, 'all.json'), JSON.stringify(listings, null, 2))
  await Deno.writeTextFile(join(OUTPUT_DIR, 'top.json'), JSON.stringify(sections, null, 2))

  console.log(`[fetch-dl-index] ✓ Fetched ${listings.length} directory listings`)
  console.log(`[fetch-dl-index] ✓ Found ${sections.length} top-level sections`)
  console.log(`[fetch-dl-index] ✓ Output: ${OUTPUT_DIR}`)
}

if (import.meta.main) {
  try {
    await main()
  } catch (err) {
    console.warn('[fetch-dl-index] ⚠ Skipped due to error:', err.message)
    // Don't exit with error - this is optional data
  }
}
