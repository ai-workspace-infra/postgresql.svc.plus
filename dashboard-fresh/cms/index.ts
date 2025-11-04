/**
 * CMS Index - Fresh + Deno compatible
 *
 * Main exports for the CMS system
 */

export {
  applyExtensionLayouts,
  collectExtensionProviders,
  getActiveExtensions,
  getActiveTheme,
} from './extensionRuntime.ts'

export {
  getAllTemplates,
  getTemplateById,
  loadTemplate,
  type TemplateInfo,
  type TemplateManifest,
} from '../lib/templateRegistry.ts'

export { listContentSourcesMetadata } from './contentSources.ts'
