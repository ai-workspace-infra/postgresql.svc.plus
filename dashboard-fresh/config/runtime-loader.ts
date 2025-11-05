/**
 * Runtime Configuration Loader - Entry Point
 *
 * Loads environment-specific configuration from YAML files.
 * This is a server-only module for Deno Fresh.
 */

// Prevent browser imports
if (typeof window !== 'undefined') {
  throw new Error('runtime-loader.ts is server-only and cannot be imported in the browser.')
}

// Export Deno native runtime loader
export * from '../server/runtime-loader.deno.ts'
