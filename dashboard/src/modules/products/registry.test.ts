import { describe, expect, it } from 'vitest'

import { PRODUCT_LIST, PRODUCT_MAP, getAllSlugs } from './registry'

describe('product registry', () => {
  it('exposes at least one product', () => {
    expect(PRODUCT_LIST.length).toBeGreaterThan(0)
  })

  it('contains unique slugs', () => {
    const slugs = getAllSlugs()
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('maps slugs to configs', () => {
    for (const product of PRODUCT_LIST) {
      expect(PRODUCT_MAP.get(product.slug)).toBe(product)
    }
  })

  it('provides expected config shape', () => {
    for (const product of PRODUCT_LIST) {
      expect(product.slug).toMatch(/^[a-z0-9-]+$/)
      expect(product.name).toBeTruthy()
      expect(product.title).toBeTruthy()
      expect(product.title_en).toBeTruthy()
      expect(product.tagline_zh).toBeTruthy()
      expect(product.tagline_en).toBeTruthy()
      expect(product.ogImage).toContain('http')
      expect(product.repoUrl).toContain('http')
      expect(product.docsQuickstart).toContain('http')
      expect(product.docsApi).toContain('http')
      expect(product.docsIssues).toContain('http')
      expect(product.blogUrl).toContain('http')
      expect(product.videosUrl).toContain('http')
      expect(product.downloadUrl).toContain('http')
    }
  })
})
