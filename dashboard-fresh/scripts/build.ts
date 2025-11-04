#!/usr/bin/env -S deno run --allow-all

/**
 * Main build script for Fresh + Deno dashboard
 * Runs all prebuild steps and prepares static assets
 */

console.log('🏗️  Building dashboard-fresh...\n')

const steps = [
  { name: 'Template Manifest', script: 'scripts/build-manifest.ts' },
  { name: 'Export Slugs', script: 'scripts/export-slugs.ts' },
  { name: 'Scan Markdown', script: 'scripts/scan-md.ts' },
  { name: 'Fetch Download Index', script: 'scripts/fetch-dl-index.ts' },
]

let failed = false

for (const step of steps) {
  console.log(`📦 ${step.name}...`)

  const command = new Deno.Command('deno', {
    args: ['run', '-A', step.script],
    stdout: 'inherit',
    stderr: 'inherit',
  })

  const process = command.spawn()
  const status = await process.status

  if (!status.success) {
    console.error(`❌ ${step.name} failed`)
    failed = true
    break
  }

  console.log(`✅ ${step.name} completed\n`)
}

if (failed) {
  console.error('\n❌ Build failed!')
  Deno.exit(1)
} else {
  console.log('🎉 Build completed successfully!')
  console.log('\n📁 Static assets generated in: static/_build/')
  console.log('\n▶️  Run `deno task start` to start the server')
}
