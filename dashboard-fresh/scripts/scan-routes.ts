#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Route Scanner and Generator for Fresh
 *
 * Scans app/* directory and generates Fresh-compatible routes
 * Maps Next.js app directory structure to Fresh routes/
 */

import { join, relative, dirname, basename } from '$std/path/mod.ts'
import { walk, ensureDir } from '$std/fs/mod.ts'

interface RouteMapping {
  nextPath: string
  freshPath: string
  type: 'page' | 'api' | 'layout' | 'loading' | 'error'
  dynamic: boolean
  params: string[]
}

const APP_DIR = 'app'
const ROUTES_DIR = 'routes'
const ROUTES_MAP_OUTPUT = 'static/_build/routes-map.json'

/**
 * Convert Next.js app directory path to Fresh route path
 */
function convertToFreshRoute(appPath: string): {
  freshPath: string
  params: string[]
  dynamic: boolean
} {
  // Remove app/ prefix
  let routePath = appPath.replace(/^app\//, '')

  // Remove file extensions
  routePath = routePath.replace(/\.(tsx|ts|jsx|js)$/, '')

  // Handle route groups (auth), (tenant) -> remove parentheses
  routePath = routePath.replace(/\([^)]+\)\//g, '')

  // Handle page.tsx -> index
  if (routePath.endsWith('/page')) {
    routePath = routePath.replace(/\/page$/, '/index')
  } else if (routePath === 'page') {
    routePath = 'index'
  }

  // Handle layout.tsx
  if (routePath.endsWith('/layout')) {
    routePath = routePath.replace(/\/layout$/, '/_layout')
  }

  // Handle loading.tsx
  if (routePath.endsWith('/loading')) {
    routePath = routePath.replace(/\/loading$/, '/_loading')
  }

  // Handle error.tsx
  if (routePath.endsWith('/error')) {
    routePath = routePath.replace(/\/error$/, '/_error')
  }

  // Extract dynamic parameters
  const params: string[] = []
  let dynamic = false

  // Handle [...segments] -> [...segments]
  const catchAllMatch = routePath.match(/\[\.\.\.(\w+)\]/g)
  if (catchAllMatch) {
    dynamic = true
    catchAllMatch.forEach((match) => {
      const paramName = match.replace(/\[\.\.\.|\]/g, '')
      params.push(`...${paramName}`)
    })
  }

  // Handle [param] -> [param]
  const dynamicMatch = routePath.match(/\[(\w+)\]/g)
  if (dynamicMatch) {
    dynamic = true
    dynamicMatch.forEach((match) => {
      const paramName = match.replace(/\[|\]/g, '')
      if (!params.includes(paramName) && !params.includes(`...${paramName}`)) {
        params.push(paramName)
      }
    })
  }

  return { freshPath: routePath, params, dynamic }
}

/**
 * Determine route type from file path
 */
function getRouteType(filePath: string): RouteMapping['type'] {
  if (filePath.includes('/api/')) return 'api'
  if (filePath.endsWith('/page.tsx') || filePath.endsWith('/page.ts')) return 'page'
  if (filePath.endsWith('/layout.tsx') || filePath.endsWith('/layout.ts')) return 'layout'
  if (filePath.endsWith('/loading.tsx') || filePath.endsWith('/loading.ts')) return 'loading'
  if (filePath.endsWith('/error.tsx') || filePath.endsWith('/error.ts')) return 'error'
  return 'page'
}

/**
 * Scan app directory for routes
 */
async function scanRoutes(): Promise<RouteMapping[]> {
  const mappings: RouteMapping[] = []

  console.log('[route-scanner] 📂 Scanning app directory...')

  for await (
    const entry of walk(APP_DIR, {
      exts: ['.tsx', '.ts'],
      skip: [/node_modules/, /_build/, /\.test\./],
    })
  ) {
    if (!entry.isFile) continue

    const relativePath = relative(Deno.cwd(), entry.path)

    // Skip non-route files
    const fileName = basename(entry.path)
    if (
      !fileName.startsWith('page.') &&
      !fileName.startsWith('layout.') &&
      !fileName.startsWith('loading.') &&
      !fileName.startsWith('error.') &&
      !relativePath.includes('/api/')
    ) {
      continue
    }

    const type = getRouteType(relativePath)
    const { freshPath, params, dynamic } = convertToFreshRoute(relativePath)

    mappings.push({
      nextPath: relativePath,
      freshPath: `${ROUTES_DIR}/${freshPath}.tsx`,
      type,
      dynamic,
      params,
    })
  }

  return mappings.sort((a, b) => a.freshPath.localeCompare(b.freshPath))
}

/**
 * Generate route statistics
 */
function generateStats(mappings: RouteMapping[]) {
  const stats = {
    total: mappings.length,
    pages: mappings.filter((m) => m.type === 'page').length,
    api: mappings.filter((m) => m.type === 'api').length,
    layouts: mappings.filter((m) => m.type === 'layout').length,
    dynamic: mappings.filter((m) => m.dynamic).length,
    static: mappings.filter((m) => !m.dynamic).length,
  }

  return stats
}

/**
 * Main execution
 */
async function main() {
  console.log('[route-scanner] 🔍 Starting route scan...\n')

  const mappings = await scanRoutes()
  const stats = generateStats(mappings)

  // Save route mappings
  await ensureDir(dirname(ROUTES_MAP_OUTPUT))
  await Deno.writeTextFile(
    ROUTES_MAP_OUTPUT,
    JSON.stringify({ mappings, stats, generatedAt: new Date().toISOString() }, null, 2),
  )

  // Display results
  console.log('[route-scanner] 📊 Scan complete!\n')
  console.log('Statistics:')
  console.log(`  Total routes: ${stats.total}`)
  console.log(`  Pages: ${stats.pages}`)
  console.log(`  API routes: ${stats.api}`)
  console.log(`  Layouts: ${stats.layouts}`)
  console.log(`  Dynamic routes: ${stats.dynamic}`)
  console.log(`  Static routes: ${stats.static}`)

  console.log(`\n✅ Route map saved to: ${ROUTES_MAP_OUTPUT}`)

  // Display some example mappings
  console.log('\n📝 Example mappings (first 10):')
  mappings.slice(0, 10).forEach((m) => {
    const dynMarker = m.dynamic ? '🔄' : '📄'
    console.log(`  ${dynMarker} ${m.nextPath}`)
    console.log(`     → ${m.freshPath}`)
  })

  if (mappings.length > 10) {
    console.log(`  ... and ${mappings.length - 10} more`)
  }
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    console.error('[route-scanner] ❌ Error:', error)
    Deno.exit(1)
  }
}
