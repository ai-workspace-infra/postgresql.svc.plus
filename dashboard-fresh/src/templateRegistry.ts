/**
 * Legacy Template Registry (Deprecated)
 *
 * This file is deprecated and maintained only for backward compatibility.
 * Please use lib/templateRegistry.ts for the new Fresh + Deno implementation.
 *
 * The new implementation:
 * - Uses build-time manifest generation
 * - Supports ESM dynamic imports
 * - Works with Deno runtime
 * - Eliminates filesystem dependencies at runtime
 */

import type { CmsTemplate } from '@cms/types.ts'
import type { TemplateDefinition } from './templates/types.ts'

// Re-export from new implementation
export {
  getAllTemplates,
  getCategories,
  getTemplateById,
  getTemplateManifest,
  getTemplatesByCategory,
  loadTemplate,
  type TemplateInfo,
  type TemplateManifest,
} from '../lib/templateRegistry.ts'

/**
 * @deprecated Use getTemplateById from lib/templateRegistry.ts
 */
export async function getTemplate(name: string): Promise<CmsTemplate> {
  const { loadTemplate } = await import('../lib/templateRegistry.ts')
  return (await loadTemplate(name)) as CmsTemplate
}

/**
 * @deprecated Template registration is now handled at build time
 */
export function registerTemplate(_name: string, _template: TemplateDefinition) {
  console.warn(
    'registerTemplate is deprecated. Templates are now registered at build time via scripts/build-manifest.ts',
  )
}

/**
 * @deprecated Use getTemplateManifest().templates from lib/templateRegistry.ts
 */
export function listRegisteredTemplateNames(): string[] {
  console.warn(
    'listRegisteredTemplateNames is deprecated. Use getAllTemplates() from lib/templateRegistry.ts',
  )
  return []
}

/**
 * @deprecated Use getTemplateById from lib/templateRegistry.ts
 */
export async function getActiveTemplate(): Promise<CmsTemplate> {
  // This would need to determine the active template based on config
  // For now, just return the default
  const { loadTemplate } = await import('../lib/templateRegistry.ts')
  return (await loadTemplate('default')) as CmsTemplate
}

export type { TemplateDefinition } from './templates/types.ts'
