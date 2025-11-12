#!/usr/bin/env node

/**
 * Generate manifest files for static build
 *
 * This script calls the Python manifest generation scripts to create
 * up-to-date manifest files in the _build directory.
 */

import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts')
const DASHBOARD_PUBLIC = path.join(process.cwd(), 'dashboard', 'public')
const BUILD_DIR = path.join(DASHBOARD_PUBLIC, '_build')

async function runPythonScript(scriptName, args = []) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName)
  const cmd = `python3 "${scriptPath}" ${args.join(' ')}`

  try {
    console.log(`[generate-manifests] Running: ${cmd}`)
    execSync(cmd, {
      cwd: SCRIPTS_DIR,
      stdio: 'inherit',
      env: { ...process.env }
    })
    return true
  } catch (err) {
    console.warn(`[generate-manifests] Warning: ${scriptName} failed: ${err.message}`)
    return false
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function main() {
  console.log('[generate-manifests] Generating manifest files for build...')

  // Ensure _build directory exists
  await ensureDir(BUILD_DIR)

  // Try to generate docs manifest (if docs exist)
  const docsRoot = path.join(process.cwd(), 'data', 'update-server', 'docs')
  if (await dirExists(docsRoot)) {
    await runPythonScript('gen_docs_manifest.py', [
      '--root', docsRoot,
      '--base-url-prefix', 'https://dl.svc.plus/docs',
      '--output', path.join(BUILD_DIR)
    ])
  } else {
    console.log('[generate-manifests] docs directory not found, skipping docs manifest')
  }

  // Try to generate offline-package manifest (if offline-package exists)
  const offlineRoot = path.join(process.cwd(), 'data', 'update-server', 'offline-package')
  if (await dirExists(offlineRoot)) {
    await runPythonScript('gen_offline-package_manifest.py', [
      '--root', offlineRoot,
      '--base-url-prefix', 'https://dl.svc.plus/offline-package',
      '--output', path.join(BUILD_DIR)
    ])
  } else {
    console.log('[generate-manifests] offline-package directory not found, skipping offline-package manifest')
  }

  // Also copy from dl-index if available (for production builds)
  const dlIndexDir = path.join(DASHBOARD_PUBLIC, 'dl-index')
  if (await dirExists(dlIndexDir)) {
    await copyFile(
      path.join(dlIndexDir, 'docs-manifest.json'),
      path.join(BUILD_DIR, 'docs_index.json')
    )
    await copyFile(
      path.join(dlIndexDir, 'artifacts-manifest.json'),
      path.join(BUILD_DIR, 'artifacts-manifest.json')
    )
    await copyFile(
      path.join(dlIndexDir, 'offline-package.json'),
      path.join(BUILD_DIR, 'offline-package.json')
    )
  }

  console.log('[generate-manifests] Manifest generation complete')
}

async function dirExists(dir) {
  try {
    const stats = await fs.stat(dir)
    return stats.isDirectory()
  } catch {
    return false
  }
}

async function copyFile(src, dest) {
  try {
    await fs.copyFile(src, dest)
    console.log(`[generate-manifests] Copied ${path.basename(src)} to ${path.basename(dest)}`)
  } catch (err) {
    // Silent fail - file might not exist
  }
}

main().catch(err => {
  console.error('[generate-manifests] Error:', err)
  process.exit(1)
})