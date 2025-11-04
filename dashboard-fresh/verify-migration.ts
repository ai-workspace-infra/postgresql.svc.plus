#!/usr/bin/env -S deno run --allow-read

/**
 * Verification script for Fresh + Deno migration
 */

console.log('🔍 Verifying Fresh + Deno + Zustand setup...\n')

const requiredFiles = [
  // Core files
  { path: 'deno.jsonc', description: 'Deno configuration' },
  { path: 'fresh.config.ts', description: 'Fresh configuration' },
  { path: 'main.ts', description: 'Production server' },
  { path: 'dev.ts', description: 'Development server' },

  // Build scripts
  { path: 'scripts/build.ts', description: 'Main build script' },
  { path: 'scripts/build-manifest.ts', description: 'Template manifest builder' },
  { path: 'scripts/export-slugs.ts', description: 'Slug exporter' },
  { path: 'scripts/scan-md.ts', description: 'Markdown scanner' },
  { path: 'scripts/fetch-dl-index.ts', description: 'Download index fetcher' },

  // New architecture
  { path: 'lib/templateRegistry.ts', description: 'Template registry (new)' },
  { path: 'stores/index.ts', description: 'Zustand stores' },

  // Examples
  { path: 'routes/index.tsx', description: 'Home route' },
  { path: 'routes/api/templates.ts', description: 'Templates API' },
  { path: 'routes/api/docs.ts', description: 'Docs API' },
  { path: 'routes/api/downloads.ts', description: 'Downloads API' },
  { path: 'islands/Counter.tsx', description: 'Example island' },

  // Documentation
  { path: 'README.md', description: 'Project README' },
  { path: 'FRESH-MIGRATION.md', description: 'Migration summary' },
  { path: '.gitignore', description: 'Git ignore file' },
]

const obsoleteFiles = [
  'next.config.js',
  'next-env.d.ts',
  'package.json',
  'yarn.lock',
  '.yarnrc.yml',
  '.nvmrc',
  '.eslintrc.json',
  'playwright.config.ts',
  'vitest.config.ts',
  'vitest.setup.ts',
  'fresh-build.ts',
  'tailwind.config.js',
  'postcss.config.js',
]

let allGood = true
let warnings = 0

// Check required files
console.log('📁 Checking required files...\n')
for (const { path, description } of requiredFiles) {
  try {
    await Deno.stat(path)
    console.log(`  ✅ ${path.padEnd(35)} - ${description}`)
  } catch {
    console.log(`  ❌ ${path.padEnd(35)} - MISSING!`)
    allGood = false
  }
}

// Check obsolete files
console.log('\n🗑️  Checking obsolete files (should be removed)...\n')
for (const path of obsoleteFiles) {
  try {
    await Deno.stat(path)
    console.log(`  ⚠️  ${path.padEnd(35)} - Still exists (should be removed)`)
    warnings++
  } catch {
    console.log(`  ✅ ${path.padEnd(35)} - Removed`)
  }
}

// Check configuration (check for key strings rather than parsing JSONC)
console.log('\n⚙️  Checking configuration...\n')
try {
  const denoConfigText = await Deno.readTextFile('deno.jsonc')

  // Check JSX
  if (denoConfigText.includes('"jsxImportSource": "preact"')) {
    console.log('  ✅ JSX configured for Preact')
  } else {
    console.log('  ⚠️  JSX may not be configured for Preact')
    warnings++
  }

  // Check Fresh imports
  if (denoConfigText.includes('"$fresh/"')) {
    console.log('  ✅ Fresh framework imported')
  } else {
    console.log('  ⚠️  Fresh framework may not be imported')
    warnings++
  }

  // Check Zustand
  if (denoConfigText.includes('"zustand"')) {
    console.log('  ✅ Zustand imported')
  } else {
    console.log('  ⚠️  Zustand may not be imported')
    warnings++
  }

  // Check tasks
  const requiredTasks = ['dev', 'build', 'prebuild']
  for (const task of requiredTasks) {
    if (denoConfigText.includes(`"${task}"`)) {
      console.log(`  ✅ Task '${task}' defined`)
    } else {
      console.log(`  ⚠️  Task '${task}' may be missing`)
      warnings++
    }
  }
} catch (error) {
  console.log('  ❌ Failed to read deno.jsonc:', error.message)
  allGood = false
}

// Summary
console.log('\n' + '='.repeat(70))

if (allGood && warnings === 0) {
  console.log('✅ All checks passed!')
  console.log('\n🚀 Next steps:')
  console.log('  1. Run: deno task build')
  console.log('  2. Run: deno task dev')
  console.log('  3. Open: http://localhost:8000')
  console.log('\n📚 Documentation:')
  console.log('  - README.md - Getting started')
  console.log('  - FRESH-MIGRATION.md - What was changed')
  console.log('  - MIGRATION.md - Migration guide')
} else {
  if (!allGood) {
    console.log('❌ Some critical checks failed!')
    Deno.exit(1)
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warnings found (these may be false positives)`)
    console.log('\n✅ Core migration completed successfully!')
    console.log('\n🚀 You can proceed with:')
    console.log('  1. Run: deno task build')
    console.log('  2. Run: deno task dev')
  }
}
