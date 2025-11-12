/**
 * Environment detection for dashboard
 *
 * Provides utilities to detect the current runtime environment
 * and adjust behavior accordingly.
 */

export const isDev = process.env.NODE_ENV === 'development'
export const isBuildTime = process.env.BUILD_TIME === 'true'
export const isStaticBuild = process.env.STATIC_BUILD === 'true'

/**
 * Check if running in static development mode (yarn start -p 3000)
 * In this mode, we should use fallback data
 */
export const isStaticDev = isDev && !process.env.__NEXT_PRIVATE_DEV_ORIGIN

/**
 * Check if we should use remote data sources
 * In production or dynamic dev mode, use remote; in static dev mode, use fallback
 */
export const shouldUseRemoteData = !isStaticDev