#!/usr/bin/env -S deno run --allow-read

/**
 * Verification script to check Deno migration setup
 */

const requiredFiles = [
  'deno.jsonc',
  'main.ts',
  'fresh-build.ts',
  'tailwind.config.ts',
  'postcss.config.ts',
  'Makefile.deno',
  'README.md',
  'MIGRATION.md',
  'SUMMARY.md',
  'scripts/export-slugs.ts',
  'scripts/scan-md.ts',
  'scripts/fetch-dl-index.ts',
]

console.log('🔍 Verifying Deno migration setup...\n')

let allFilesExist = true

for (const file of requiredFiles) {
  try {
    await Deno.stat(file)
    console.log(`✓ ${file}`)
  } catch {
    console.log(`✗ ${file} - MISSING!`)
    allFilesExist = false
  }
}

console.log('\n' + '='.repeat(50))

if (allFilesExist) {
  console.log('✅ All required files are present!')
  console.log('\n📋 Next steps:')
  console.log('  1. Run: deno task dev')
  console.log('  2. Test: deno task build')
  console.log('  3. Check: deno task check')
  console.log('\n📚 Documentation:')
  console.log('  - README.md - Getting started')
  console.log('  - MIGRATION.md - Migration guide')
  console.log('  - SUMMARY.md - What was done')
} else {
  console.log('❌ Some files are missing!')
  Deno.exit(1)
}
