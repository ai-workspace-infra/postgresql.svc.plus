import fs from 'node:fs'
import path from 'node:path'

import { cmsConfig } from '@cms/config'
import type { CmsTemplate } from '@cms/types'

import defaultTemplate from './templates/default'
import type { TemplateDefinition } from './templates/types'

const BUILTIN_TEMPLATES: Record<string, TemplateDefinition> = {
  default: defaultTemplate,
}

const runtimeTemplates = new Map<string, TemplateDefinition>()
const templateLoaders: TemplateLoader[] = []

export type TemplateLoader = (name: string) => TemplateDefinition | null

const FILE_PREFIX = 'file:'

registerTemplateLoader(filesystemTemplateLoader)

export interface TemplateSelectionOptions {
  name?: string
  /**
   * Override template name from configuration and environment.
   */
  fallbackToConfig?: boolean
}

export function registerTemplate(name: string, template: TemplateDefinition) {
  runtimeTemplates.set(name, template)
}

export function registerTemplateLoader(loader: TemplateLoader) {
  templateLoaders.push(loader)
}

export function listRegisteredTemplateNames(): string[] {
  return Array.from(new Set([...Object.keys(BUILTIN_TEMPLATES), ...runtimeTemplates.keys()]))
}

export function getTemplate(name: string): CmsTemplate {
  if (runtimeTemplates.has(name)) {
    return runtimeTemplates.get(name) as CmsTemplate
  }

  if (BUILTIN_TEMPLATES[name]) {
    return BUILTIN_TEMPLATES[name] as CmsTemplate
  }

  const loadedTemplate = tryLoadTemplate(name)
  if (loadedTemplate) {
    runtimeTemplates.set(name, loadedTemplate)
    return loadedTemplate as CmsTemplate
  }

  throw new Error(`Template \"${name}\" is not registered.`)
}

export function resolveTemplateName(explicitName?: string, options?: TemplateSelectionOptions): string {
  if (explicitName) {
    return explicitName
  }

  const envOverride =
    typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_TEMPLATE || process.env.CMS_TEMPLATE)

  if (envOverride) {
    return envOverride
  }

  if (options?.fallbackToConfig === false) {
    throw new Error('Template name not provided and config fallback disabled.')
  }

  return cmsConfig.template
}

export function getActiveTemplate(options?: TemplateSelectionOptions): CmsTemplate {
  const name = resolveTemplateName(options?.name, options)
  return getTemplate(name)
}

function tryLoadTemplate(name: string): TemplateDefinition | null {
  for (const loader of templateLoaders) {
    const template = loader(name)
    if (template) {
      return template
    }
  }
  return null
}

function filesystemTemplateLoader(name: string): TemplateDefinition | null {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    return null
  }

  if (!name.startsWith(FILE_PREFIX)) {
    const basePath = path.join(process.cwd(), 'src', 'modules', 'templates', name)
    const candidates = ['index.js', 'index.cjs']
    for (const candidate of candidates) {
      const candidatePath = path.join(basePath, candidate)
      if (fs.existsSync(candidatePath)) {
        return loadTemplateModule(candidatePath)
      }
    }
    return null
  }

  const request = name.slice(FILE_PREFIX.length)
  const absolutePath = path.isAbsolute(request) ? request : path.join(process.cwd(), request)
  if (!fs.existsSync(absolutePath)) {
    return null
  }
  return loadTemplateModule(absolutePath)
}

function loadTemplateModule(modulePath: string): TemplateDefinition | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(modulePath)
    const template = (mod?.default ?? mod) as TemplateDefinition | undefined
    if (!template || typeof template !== 'object') {
      return null
    }
    if (!template.pages || typeof template.pages.home !== 'function') {
      return null
    }
    return template
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Failed to load template module at ${modulePath}:`, error)
    }
    return null
  }
}

export function __resetTemplateRegistryForTests() {
  runtimeTemplates.clear()
  templateLoaders.length = 0
  registerTemplateLoader(filesystemTemplateLoader)
}

export type { TemplateDefinition } from './templates/types'
