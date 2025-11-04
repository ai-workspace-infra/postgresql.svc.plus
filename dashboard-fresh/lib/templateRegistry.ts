/**
 * Template Registry - Runtime Module (Deno)
 *
 * This module provides runtime access to templates through the pre-built manifest.
 * The manifest is generated at build time by scripts/build-manifest.ts
 *
 * Note: Uses runtime loading instead of static import to avoid module resolution issues
 */

import { join } from '$std/path/mod.ts'

const MANIFEST_PATH = join(Deno.cwd(), 'static/_build/template-manifest.json')

export interface TemplateInfo {
  id: string
  path: string
  category?: string
  name?: string
}

export interface TemplateManifest {
  version: string
  generatedAt: string
  templates: TemplateInfo[]
  count: number
}

/**
 * Load the template manifest from disk (with fallback)
 */
async function loadManifest(): Promise<TemplateManifest> {
  try {
    const content = await Deno.readTextFile(MANIFEST_PATH)
    return JSON.parse(content) as TemplateManifest
  } catch (error) {
    console.warn('Template manifest not found, returning empty manifest:', error instanceof Error ? error.message : String(error))
    return {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      templates: [],
      count: 0,
    }
  }
}

/**
 * Get the template manifest
 */
export async function getTemplateManifest(): Promise<TemplateManifest> {
  return await loadManifest()
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<TemplateInfo[]> {
  const manifest = await loadManifest()
  return manifest.templates
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string): Promise<TemplateInfo | undefined> {
  const manifest = await loadManifest()
  return manifest.templates.find((t) => t.id === id)
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<TemplateInfo[]> {
  const manifest = await loadManifest()
  return manifest.templates.filter((t) => t.category === category)
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<string[]> {
  const manifest = await loadManifest()
  const categories = new Set(manifest.templates.map((t) => t.category).filter(Boolean))
  return Array.from(categories) as string[]
}

/**
 * Dynamically import a template component
 * This uses Deno's dynamic import capability
 */
export async function loadTemplate(id: string): Promise<unknown> {
  const template = await getTemplateById(id)
  if (!template) {
    throw new Error(`Template not found: ${id}`)
  }

  // Dynamic import of the template module
  // The path should be relative to the project root
  const module = await import(`..${template.path}`)
  return module.default || module
}
