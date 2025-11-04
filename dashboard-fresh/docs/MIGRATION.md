# Deno Migration Guide

This document provides a comprehensive guide for migrating the dashboard from Node.js to Deno.

## Overview

The migration strategy follows a phased approach:

1. **Phase 1 (Current)**: Hybrid setup - Deno for tooling, Node.js for Next.js
2. **Phase 2**: Gradual component migration to Deno-compatible code
3. **Phase 3**: Complete Deno migration (optional Fresh framework)

## What's Changed

### Configuration Files

#### deno.jsonc (NEW)
Replaces multiple configuration files:
- `package.json` scripts → `deno.jsonc` tasks
- `tsconfig.json` paths → `deno.jsonc` imports
- npm dependencies → `deno.jsonc` imports with `npm:` prefix

```jsonc
{
  "tasks": {
    "dev": "deno run -A main.ts",
    "build": "deno run -A fresh-build.ts"
  },
  "imports": {
    "@components/": "./components/",
    "react": "npm:react@18.2.0"
  }
}
```

#### Tailwind & PostCSS (UPDATED)
Converted from CommonJS to ESM:

```typescript
// Before (CommonJS)
module.exports = { /* config */ }

// After (ESM)
export default { /* config */ } satisfies Config
```

### Scripts

All build scripts converted to Deno:

| Old (Node.js) | New (Deno) | Changes |
|---------------|------------|---------|
| `fs/promises` | `Deno.readTextFile()` | Native Deno APIs |
| `path` | `$std/path/mod.ts` | Deno standard library |
| `process.exit(1)` | `Deno.exit(1)` | Deno global |
| `__dirname` | `import.meta.url` | ES modules |

### Task Commands

| Old Command | New Command | Notes |
|-------------|-------------|-------|
| `npm run dev` | `deno task dev` | Starts Next.js via wrapper |
| `npm run build` | `deno task build` | Includes prebuild steps |
| `npm run lint` | `deno task lint` | Uses Deno's built-in linter |
| `npm test` | `deno task test` | Deno test runner |

## Migration Checklist

### ✅ Completed (Phase 1)

- [x] Create `deno.jsonc` with tasks and imports
- [x] Convert Tailwind config to ESM (`tailwind.config.ts`)
- [x] Convert PostCSS config to ESM (`postcss.config.ts`)
- [x] Migrate build scripts to Deno:
  - [x] `scripts/export-slugs.ts`
  - [x] `scripts/scan-md.ts`
  - [x] `scripts/fetch-dl-index.ts`
- [x] Create Deno development server wrapper (`main.ts`)
- [x] Create Deno build script (`fresh-build.ts`)
- [x] Set up path aliases in Deno imports
- [x] Create Makefile for CI/CD integration

### 🚧 In Progress (Phase 2)

- [ ] Update import statements to use Deno conventions
- [ ] Replace Node.js APIs with Deno equivalents
- [ ] Migrate tests to Deno test framework
- [ ] Update CI/CD pipelines to use Deno tasks

### 📋 Planned (Phase 3)

- [ ] Remove Node.js dependency
- [ ] Evaluate Fresh framework migration
- [ ] Implement server-side rendering with Deno

## Common Migration Patterns

### File System Operations

```typescript
// Before (Node.js)
import fs from 'fs/promises'
const content = await fs.readFile('file.txt', 'utf8')
await fs.writeFile('file.txt', content)

// After (Deno)
const content = await Deno.readTextFile('file.txt')
await Deno.writeTextFile('file.txt', content)
```

### Path Operations

```typescript
// Before (Node.js)
import path from 'path'
const fullPath = path.join(__dirname, 'file.txt')

// After (Deno)
import { join } from '$std/path/mod.ts'
const fullPath = join(Deno.cwd(), 'file.txt')
// Or using import.meta.url for module-relative paths
const moduleDir = new URL('.', import.meta.url).pathname
```

### Environment Variables

```typescript
// Before (Node.js)
const value = process.env.MY_VAR

// After (Deno)
const value = Deno.env.get('MY_VAR')
```

### Process Exit

```typescript
// Before (Node.js)
process.exit(1)

// After (Deno)
Deno.exit(1)
```

### NPM Packages

```typescript
// Before
import { something } from 'package-name'

// After (in deno.jsonc)
{
  "imports": {
    "package-name": "npm:package-name@version"
  }
}
// Then in code
import { something } from 'package-name'
```

## Permissions

Deno is secure by default. Scripts require explicit permissions:

```bash
# All permissions (development)
deno run -A script.ts

# Specific permissions (production)
deno run \
  --allow-read=. \
  --allow-write=./public \
  --allow-net=api.example.com \
  --allow-env=API_KEY \
  script.ts
```

### Common Permissions

- `--allow-read` - File system read access
- `--allow-write` - File system write access
- `--allow-net` - Network access
- `--allow-env` - Environment variable access
- `--allow-run` - Subprocess execution
- `-A` - All permissions (use cautiously)

## CI/CD Updates

### GitHub Actions Example

```yaml
# Before (Node.js)
name: Build and Test
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test

# After (Deno)
name: Build and Test
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.40.0
      # Still need Node.js temporarily for Next.js
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: deno task build
      - run: deno task test
```

### Makefile Integration

```makefile
# Use the provided Makefile.deno
include Makefile.deno

# Or use directly
.PHONY: ci
ci:
	deno task fmt:check
	deno task lint
	deno task check
	deno task test
	deno task build
```

## Troubleshooting

### Import Errors

**Problem**: `Cannot find module` or `Module not found`

**Solution**:
1. Check `deno.jsonc` imports section
2. Add npm package with version: `"package": "npm:package@version"`
3. For local imports, use explicit file extensions: `./file.ts` not `./file`

### Type Errors

**Problem**: TypeScript errors with npm packages

**Solution**:
1. Add type definitions to imports:
   ```jsonc
   {
     "imports": {
       "@types/node": "npm:@types/node@20"
     }
   }
   ```
2. Use `// @deno-types` directive:
   ```typescript
   // @deno-types="npm:@types/package"
   import pkg from 'npm:package'
   ```

### Permission Denied

**Problem**: `PermissionDenied` errors

**Solution**: Add required permissions to task or command:
```jsonc
{
  "tasks": {
    "script": "deno run --allow-read --allow-write script.ts"
  }
}
```

### Next.js Still Uses Node

This is expected during Phase 1-2. The build process calls `npx next build` which requires Node.js. This will be addressed in Phase 3.

## Benefits of Deno

1. **Security**: Explicit permissions by default
2. **Tooling**: Built-in formatter, linter, test runner
3. **TypeScript**: First-class TypeScript support
4. **Modern APIs**: Web standard APIs (fetch, etc.)
5. **Dependencies**: No node_modules, URL-based imports
6. **Performance**: Rust-based runtime

## Next Steps

1. **Familiarize with Deno tasks**: Run `deno task --help`
2. **Review new configurations**: Read `deno.jsonc` carefully
3. **Test build process**: Run `deno task build` locally
4. **Update CI/CD**: Integrate Deno tasks into your pipeline
5. **Monitor migration**: Track progress in README.md

## Resources

- [Deno Manual](https://deno.land/manual)
- [Deno Standard Library](https://deno.land/std)
- [Node to Deno Cheatsheet](https://deno.land/manual/node/cheatsheet)
- [Fresh Framework](https://fresh.deno.dev/)

## Support

For questions or issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [Deno documentation](https://deno.land/manual)
3. Consult with the team
4. Open an issue in the project repository
