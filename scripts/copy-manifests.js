#!/usr/bin/env node

/**
 * Copy manifest files from dl-index to _build for static build
 *
 * This script ensures that the latest manifest files are available
 * in the _build directory for both dev and production builds.
 */

import fs from 'fs/promises'
import path from 'path'

const DASHBOARD_PUBLIC = path.join(process.cwd(), 'public')
const DL_INDEX_DIR = path.join(DASHBOARD_PUBLIC, 'dl-index')
const BUILD_DIR = path.join(DASHBOARD_PUBLIC, '_build')

async function copyFile(src, dest) {
  try {
    await fs.copyFile(src, dest)
    console.log(`[copy-manifests] Copied ${path.basename(src)} to ${path.basename(dest)}`)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`[copy-manifests] Warning: ${src} not found, skipping`)
    } else {
      console.warn(`[copy-manifests] Warning: Failed to copy ${src}: ${err.message}`)
    }
  }
}

async function main() {
  console.log('[copy-manifests] Ensuring manifests are up to date for build...')

  // Ensure _build directory exists
  await fs.mkdir(BUILD_DIR, { recursive: true })

  // Copy artifacts-manifest.json from dl-index if it exists
  const artifactsSrc = path.join(DL_INDEX_DIR, 'artifacts-manifest.json')
  const artifactsDest = path.join(BUILD_DIR, 'artifacts-manifest.json')
  await copyFile(artifactsSrc, artifactsDest)

  // Copy docs-manifest.json from dl-index if it exists
  const docsSrc = path.join(DL_INDEX_DIR, 'docs-manifest.json')
  const docsDest = path.join(BUILD_DIR, 'docs_index.json')
  await copyFile(docsSrc, docsDest)

  // Copy offline-package.json from dl-index if it exists
  const offlineSrc = path.join(DL_INDEX_DIR, 'offline-package.json')
  const offlineDest = path.join(BUILD_DIR, 'offline-package.json')
  await copyFile(offlineSrc, offlineDest)

  console.log('[copy-manifests] Manifest files synchronized')
}

main().catch(err => {
  console.error('[copy-manifests] Error:', err)
  process.exit(1)
})