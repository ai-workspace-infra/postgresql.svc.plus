import { promises as fs } from 'fs'
import path from 'path'

import { readMarkdownDirectory, readMarkdownFile } from '../../../lib/markdown'
import { resolveContentSource } from './source'
import { isFeatureEnabled } from '../../../lib/featureToggles'

export interface HeroContent {
  eyebrow?: string
  title: string
  subtitle?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  highlights: string[]
  bodyHtml: string
}

export interface HeroSolution {
  slug: string
  title: string
  tagline?: string
  description?: string
  features: string[]
  bodyHtml: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  tertiaryCtaLabel?: string
  tertiaryCtaHref?: string
}

export interface HomepagePost {
  slug: string
  title: string
  author?: string
  date?: string
  readingTime?: string
  tags: string[]
  excerpt: string
  contentHtml: string
}

export interface SidebarSection {
  slug: string
  title: string
  layout?: string
  tags: string[]
  bodyHtml: string
  ctaLabel?: string
  ctaHref?: string
  order?: number
}

export interface ContactItemContent {
  slug: string
  title: string
  type?: string
  description?: string
  bodyHtml: string
  qrValue?: string
  qrImage?: string
  icon?: string
  ctaLabel?: string
  ctaHref?: string
}

export interface ContactPanelContent {
  title: string
  subtitle?: string
  bodyHtml?: string
  items: ContactItemContent[]
}

const { absolutePath: HOMEPAGE_CONTENT_ROOT } = resolveContentSource('homepage')
const CMS_HOMEPAGE_FLAG_PATH = '/homepage/dynamic'

const FALLBACK_HERO: HeroContent = {
  title: '欢迎来到 XControl',
  highlights: [],
  bodyHtml: '',
}

const isCmsHomepageEnabled = () => isFeatureEnabled('cmsExperience', CMS_HOMEPAGE_FLAG_PATH)

function ensureString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const stringItem = ensureString(item)
      if (stringItem) {
        return stringItem
      }
    }
  }
  return undefined
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => ensureString(item))
      .filter((item): item is string => Boolean(item && item.trim()))
  }
  const single = ensureString(value)
  return single ? [single] : []
}

function ensureNumber(value: unknown): number | undefined {
  const stringValue = ensureString(value)
  if (!stringValue) {
    return undefined
  }
  const parsed = Number(stringValue)
  return Number.isFinite(parsed) ? parsed : undefined
}

function extractExcerpt(markdown: string): string {
  const blocks = markdown.split(/\r?\n\s*\r?\n/)
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    const withoutFormatting = trimmed
      .replace(/^#+\s*/g, '')
      .replace(/[`*_>\[\]]/g, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    if (withoutFormatting.trim()) {
      return withoutFormatting.trim()
    }
  }
  return ''
}

export async function getHomepageHero(): Promise<HeroContent> {
  if (!isCmsHomepageEnabled()) {
    return FALLBACK_HERO
  }

  const hero = await readMarkdownFile('hero.md', { baseDir: HOMEPAGE_CONTENT_ROOT })

  return {
    eyebrow: ensureString(hero.metadata.eyebrow),
    title: ensureString(hero.metadata.title) ?? '欢迎来到 XControl',
    subtitle: ensureString(hero.metadata.subtitle),
    primaryCtaLabel: ensureString(hero.metadata.primaryCtaLabel),
    primaryCtaHref: ensureString(hero.metadata.primaryCtaHref),
    secondaryCtaLabel: ensureString(hero.metadata.secondaryCtaLabel),
    secondaryCtaHref: ensureString(hero.metadata.secondaryCtaHref),
    highlights: ensureStringArray(hero.metadata.highlights),
    bodyHtml: hero.html,
  }
}

export async function getHeroSolutions(): Promise<HeroSolution[]> {
  if (!isCmsHomepageEnabled()) {
    return []
  }

  let solutions: (HeroSolution & { order?: number })[] = []
  try {
    const files = await readMarkdownDirectory('solutions', { baseDir: HOMEPAGE_CONTENT_ROOT })
    solutions = files.map((file) => ({
      slug: file.slug,
      title: ensureString(file.metadata.title) ?? file.slug,
      tagline: ensureString(file.metadata.tagline),
      description: ensureString(file.metadata.description),
      features: ensureStringArray(file.metadata.features),
      bodyHtml: file.html,
      primaryCtaLabel: ensureString(file.metadata.primaryCtaLabel),
      primaryCtaHref: ensureString(file.metadata.primaryCtaHref),
      secondaryCtaLabel: ensureString(file.metadata.secondaryCtaLabel),
      secondaryCtaHref: ensureString(file.metadata.secondaryCtaHref),
      tertiaryCtaLabel: ensureString(file.metadata.tertiaryCtaLabel),
      tertiaryCtaHref: ensureString(file.metadata.tertiaryCtaHref),
      order: ensureNumber(file.metadata.order),
    }))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  return solutions
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return a.title.localeCompare(b.title, 'zh-CN')
    })
    .map(({ order: _order, ...solution }) => solution)
}

export async function getHomepagePosts(): Promise<HomepagePost[]> {
  if (!isCmsHomepageEnabled()) {
    return []
  }

  const postsDir = path.join('posts')
  const posts = await readMarkdownDirectory(postsDir, { baseDir: HOMEPAGE_CONTENT_ROOT })

  const enriched = posts.map((post) => {
    const title = ensureString(post.metadata.title) ?? post.slug
    const author = ensureString(post.metadata.author)
    const date = ensureString(post.metadata.date)
    const readingTime = ensureString(post.metadata.readingTime)
    const tags = ensureStringArray(post.metadata.tags)
    const excerptMetadata = ensureString(post.metadata.excerpt)
    const excerpt = excerptMetadata ?? extractExcerpt(post.content)

    return {
      slug: post.slug,
      title,
      author,
      date,
      readingTime,
      tags,
      excerpt,
      contentHtml: post.html,
    }
  })

  const withParsedDates = enriched.map((post) => ({
    ...post,
    dateValue: post.date ? new Date(post.date) : undefined,
  }))

  withParsedDates.sort((a, b) => {
    if (a.dateValue && b.dateValue) {
      return b.dateValue.getTime() - a.dateValue.getTime()
    }
    if (a.dateValue) return -1
    if (b.dateValue) return 1
    return a.title.localeCompare(b.title)
  })

  return withParsedDates.map(({ dateValue: _dateValue, ...post }) => post)
}

export async function getSidebarSections(): Promise<SidebarSection[]> {
  if (!isCmsHomepageEnabled()) {
    return []
  }

  const sidebarDir = path.join('sidebar')
  let sections: SidebarSection[] = []
  try {
    const files = await readMarkdownDirectory(sidebarDir, { baseDir: HOMEPAGE_CONTENT_ROOT })
    sections = files.map((file) => ({
      slug: file.slug,
      title: ensureString(file.metadata.title) ?? file.slug,
      layout: ensureString(file.metadata.layout),
      tags: ensureStringArray(file.metadata.tags),
      bodyHtml: file.html,
      ctaLabel: ensureString(file.metadata.ctaLabel),
      ctaHref: ensureString(file.metadata.ctaHref),
      order: ensureNumber(file.metadata.order),
    }))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  return sections
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return a.title.localeCompare(b.title, 'zh-CN')
    })
    .map(({ order: _order, ...section }) => section)
}

export async function getContactPanelContent(): Promise<ContactPanelContent | undefined> {
  if (!isCmsHomepageEnabled()) {
    return undefined
  }

  let panelFile
  try {
    panelFile = await readMarkdownFile(path.join('contact', 'panel.md'), { baseDir: HOMEPAGE_CONTENT_ROOT })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined
    }
    throw error
  }

  let items: (ContactItemContent & { order?: number })[] = []
  try {
    const itemFiles = await readMarkdownDirectory(path.join('contact', 'items'), {
      baseDir: HOMEPAGE_CONTENT_ROOT,
    })
    items = itemFiles.map((file) => ({
      slug: file.slug,
      title: ensureString(file.metadata.title) ?? file.slug,
      type: ensureString(file.metadata.type),
      description: ensureString(file.metadata.description),
      bodyHtml: file.html,
      qrValue: ensureString(file.metadata.qrValue),
      qrImage: ensureString(file.metadata.qrImage),
      icon: ensureString(file.metadata.icon),
      ctaLabel: ensureString(file.metadata.ctaLabel),
      ctaHref: ensureString(file.metadata.ctaHref),
      order: ensureNumber(file.metadata.order),
    }))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  const sortedItems = items
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return a.title.localeCompare(b.title, 'zh-CN')
    })
    .map(({ order: _order, ...item }) => item)

  return {
    title: ensureString(panelFile.metadata.title) ?? '保持联系',
    subtitle: ensureString(panelFile.metadata.subtitle),
    bodyHtml: panelFile.html,
    items: sortedItems,
  }
}

export async function getContentLastUpdated(): Promise<string | undefined> {
  if (!isCmsHomepageEnabled()) {
    return undefined
  }

  try {
    const stats = await fs.stat(path.join(HOMEPAGE_CONTENT_ROOT, 'hero.md'))
    return stats.mtime.toISOString()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
  return undefined
}
