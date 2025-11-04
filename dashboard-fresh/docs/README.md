# Fresh + Deno + Zustand Dashboard

A modern, performant dashboard built with Fresh, Deno, and Zustand.

## Architecture

- **Fresh**: Modern web framework for Deno with islands architecture
- **Deno**: Secure runtime for JavaScript and TypeScript
- **Zustand**: Lightweight state management
- **Preact**: Fast 3kb alternative to React (used by Fresh)

## Project Structure

```
dashboard-fresh/
├── routes/              # Fresh file-based routes
│   ├── index.tsx        # Home page
│   └── api/             # API endpoints
├── islands/             # Interactive components (client-side)
│   └── Counter.tsx      # Example island
├── components/          # Static components (server-side)
├── stores/              # Zustand stores
│   └── index.ts         # Global state stores
├── lib/                 # Utility libraries
│   └── templateRegistry.ts  # Runtime template system
├── scripts/             # Build scripts
│   ├── build.ts         # Main build script
│   ├── build-manifest.ts    # Template manifest builder
│   ├── export-slugs.ts      # Slug exporter
│   ├── scan-md.ts           # Markdown scanner
│   └── fetch-dl-index.ts    # Download index fetcher
├── static/              # Static assets
│   └── _build/          # Build-time generated assets
├── cms/                 # Content management
├── deno.jsonc           # Deno configuration
├── fresh.config.ts      # Fresh configuration
├── main.ts              # Production server
└── dev.ts               # Development server
```

## Getting Started

### Prerequisites

- **Deno** 1.40.0 or higher

### Development

```bash
# Start development server
deno task dev
```

The server will start at `http://localhost:8000`

### Building

```bash
# Run build (generates static assets)
deno task build

# Start production server
deno task start
```

## Available Commands

```bash
# Development
deno task dev          # Start dev server with hot reload

# Build
deno task prebuild     # Run all prebuild scripts
deno task build        # Full build process

# Quality
deno task lint         # Lint code
deno task fmt          # Format code
deno task check        # Type check

# Testing
deno task test         # Run tests

# Utilities
deno task clean        # Clean build artifacts
deno task update       # Update Fresh framework
```

## Key Features

### 🏝️ Islands Architecture

Fresh uses an islands architecture where:
- **Routes** are server-rendered by default
- **Islands** are interactive components that run on the client
- Only necessary JavaScript is shipped to the browser

Example island:
```tsx
// islands/Counter.tsx
import { useState } from 'preact/hooks'

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### 🏪 Zustand State Management

Global state is managed with Zustand stores:

```tsx
// stores/index.ts
import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}))

// Use in islands
import { useUIStore } from '@/stores/index.ts'

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  // ...
}
```

### 📝 Template System

Templates are discovered at build time:

1. **Build time**: `scripts/build-manifest.ts` scans template directories
2. **Runtime**: `lib/templateRegistry.ts` provides template access via manifest
3. **API**: `/api/templates` exposes template metadata

### 📦 Build-Time Data Generation

Static data is generated during build and served from `static/_build/`:

- **Template manifest**: `template-manifest.json`
- **Documentation index**: `docs_index.json`
- **Download listings**: `dl-index/all.json`
- **Cloud IAC index**: `cloud_iac_index.json`

This eliminates runtime filesystem dependencies and improves performance.

## API Routes

### GET /api/templates
Returns template manifest with all available templates.

### GET /api/docs
Returns documentation index with all markdown files.

### GET /api/downloads
Returns download directory listings.

## Configuration

### deno.jsonc

Main configuration file with:
- **Tasks**: Development, build, and utility commands
- **Imports**: Path aliases and dependencies
- **Compiler options**: TypeScript and JSX settings

### fresh.config.ts

Fresh framework configuration:
```typescript
import { defineConfig } from '$fresh/server.ts'
import tailwind from '$fresh/plugins/tailwind.ts'

export default defineConfig({
  plugins: [tailwind()],
})
```

## Path Aliases

Configured in `deno.jsonc`:

```typescript
import { Component } from '@components/Button.tsx'
import { useStore } from '@/stores/index.ts'
import { helper } from '@lib/utils.ts'
```

Available aliases:
- `@/` → Project root
- `@components/` → Components directory
- `@islands/` → Islands directory
- `@lib/` → Library directory
- `@routes/` → Routes directory
- `@cms/` → CMS directory

## Environment Variables

Create a `.env` file in the project root:

```env
# Download base URL
DL_BASE=https://dl.svc.plus/

# Other environment variables
# ...
```

## Deployment

### Production Build

```bash
# 1. Run build to generate static assets
deno task build

# 2. Start production server
deno task start
```

### Docker

```dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app
COPY . .

RUN deno task build

EXPOSE 8000
CMD ["deno", "task", "start"]
```

## Performance

Fresh optimizes performance through:

- **Zero runtime overhead**: Only islands are hydrated on the client
- **Minimal JavaScript**: Average page loads only ~10kb of JS
- **Edge-ready**: Deploy anywhere Deno runs
- **Build-time generation**: Static data eliminates runtime I/O

## Differences from Next.js

| Feature | Next.js | Fresh + Deno |
|---------|---------|--------------|
| Runtime | Node.js | Deno |
| UI Library | React | Preact |
| Hydration | Full page | Islands only |
| Config | Multiple files | deno.jsonc |
| Package Manager | npm/yarn | Deno (none needed) |
| API Routes | Yes | Yes |
| SSR | Yes | Yes |
| SSG | Yes | Partial |

## Troubleshooting

### Module not found

Make sure imports use `.ts` or `.tsx` extensions:
```typescript
// ❌ Wrong
import { helper } from './utils'

// ✅ Correct
import { helper } from './utils.ts'
```

### Permission denied

Deno requires explicit permissions. Use `-A` for all permissions in development:
```bash
deno run -A script.ts
```

### Fresh not detecting routes

Routes must be in the `routes/` directory and export a default component or handler.

## Learn More

- [Fresh Documentation](https://fresh.deno.dev/)
- [Deno Manual](https://deno.land/manual)
- [Preact Documentation](https://preactjs.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## Migration from Next.js

See [MIGRATION.md](./MIGRATION.md) for detailed migration guide.

## License

[Your License]
