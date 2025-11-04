import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import { cmsConfig } from '@cms/config'

vi.mock('@cms/content/source', () => ({
  resolveContentSource: () => ({
    absolutePath: 'cms/content',
  }),
}))

import {
  __resetTemplateRegistryForTests,
  getActiveTemplate,
  listRegisteredTemplateNames,
  registerTemplate,
  registerTemplateLoader,
  resolveTemplateName,
  type TemplateDefinition,
} from '../templateRegistry'

const originalTemplateName = cmsConfig.template
const templateFixturesPath = path.join(process.cwd(), 'src', 'templates', 'fs-template')

const runtimeTemplate: TemplateDefinition = {
  name: 'runtime',
  pages: {
    home: () => null,
  },
}

beforeEach(() => {
  __resetTemplateRegistryForTests()
  cmsConfig.template = 'default'
  delete process.env.NEXT_PUBLIC_TEMPLATE
  delete process.env.CMS_TEMPLATE
  fs.rmSync(templateFixturesPath, { recursive: true, force: true })
})

afterEach(() => {
  cmsConfig.template = originalTemplateName
  delete process.env.NEXT_PUBLIC_TEMPLATE
  delete process.env.CMS_TEMPLATE
  __resetTemplateRegistryForTests()
  const modulePath = path.join(templateFixturesPath, 'index.js')
  delete require.cache[modulePath]
  fs.rmSync(templateFixturesPath, { recursive: true, force: true })
})

describe('templateRegistry', () => {
  it('returns the default template from configuration', () => {
    const template = getActiveTemplate()
    expect(template.name).toBe('default')
  })

  it('prefers an explicit template name over configuration', () => {
    registerTemplate('runtime', runtimeTemplate)
    const template = getActiveTemplate({ name: 'runtime' })
    expect(template).toBe(runtimeTemplate)
  })

  it('allows environment variables to override the template', () => {
    registerTemplate('runtime', runtimeTemplate)
    process.env.NEXT_PUBLIC_TEMPLATE = 'runtime'
    const template = getActiveTemplate()
    expect(template).toBe(runtimeTemplate)
  })

  it('throws when config fallback is disabled and name is missing', () => {
    expect(() => resolveTemplateName(undefined, { fallbackToConfig: false })).toThrowError()
  })

  it('supports registering custom loaders', () => {
    const loaderTemplate: TemplateDefinition = {
      name: 'loader',
      pages: {
        home: () => null,
      },
    }

    registerTemplateLoader((name) => {
      return name === 'loader-template' ? loaderTemplate : null
    })

    const template = getActiveTemplate({ name: 'loader-template', fallbackToConfig: false })
    expect(template).toBe(loaderTemplate)
  })

  it('discovers templates from the filesystem', () => {
    fs.mkdirSync(templateFixturesPath, { recursive: true })
    const templateModulePath = path.join(templateFixturesPath, 'index.js')
    fs.writeFileSync(
      templateModulePath,
      "module.exports = { name: 'fs-template', pages: { home: () => null } };\n",
      'utf8',
    )

    delete require.cache[templateModulePath]
    expect(fs.existsSync(templateModulePath)).toBe(true)
    expect(path.join(process.cwd(), 'src', 'templates', 'fs-template', 'index.js')).toBe(templateModulePath)

    cmsConfig.template = 'fs-template'
    const template = getActiveTemplate()
    expect(template.name).toBe('fs-template')
  })

  it('keeps the @cms facade compatible', async () => {
    const direct = getActiveTemplate()

    vi.stubGlobal('window', undefined)
    const { getActiveTemplate: legacyGetActiveTemplate } = await import('@cms')
    vi.unstubAllGlobals()

    const facade = legacyGetActiveTemplate()
    expect(facade).toEqual(direct)
  })

  it('lists registered template names including runtime additions', () => {
    registerTemplate('runtime', runtimeTemplate)
    const names = listRegisteredTemplateNames()
    expect(names).toContain('default')
    expect(names).toContain('runtime')
  })
})
