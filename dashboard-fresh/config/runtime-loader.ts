import 'server-only'

if (typeof window !== 'undefined') {
  throw new Error('runtime-loader.ts is server-only and cannot be imported in the browser.')
}

export * from '../server/runtime-loader'
