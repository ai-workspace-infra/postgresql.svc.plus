import fs from 'node:fs/promises'
import matter from 'gray-matter'
import sanitizeHtml from 'sanitize-html'
import { marked } from 'marked'

import { assertContentFile, ContentNotFoundError, normalizeContentPath, toContentRelativePath } from './content-utils'

export interface MarkdownRenderResult {
  path: string
  html: string
  meta: Record<string, unknown>
}

const cache = new Map<string, { mtimeMs: number; result: MarkdownRenderResult }>()

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  })
}

function serializeFrontmatter(data: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const serializeValue = (value: unknown): unknown => {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (Array.isArray(value)) {
      return value.map(serializeValue)
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, serializeValue(nested)])
      )
    }
    return value
  }

  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, serializeValue(value)]))
}

export async function renderMarkdownFile(requestPath: string): Promise<MarkdownRenderResult> {
  const absolutePath = await assertContentFile(requestPath)
  const stats = await fs.stat(absolutePath)
  const cached = cache.get(absolutePath)
  if (cached && cached.mtimeMs === stats.mtimeMs) {
    return cached.result
  }

  const fileContent = await fs.readFile(absolutePath, 'utf8')
  const { content, data } = matter(fileContent)

  const rawHtml = marked.parse(content, { async: false }) as string
  const html = sanitize(rawHtml)

  const result: MarkdownRenderResult = {
    path: toContentRelativePath(absolutePath),
    html,
    meta: serializeFrontmatter(data as Record<string, unknown> | undefined),
  }

  cache.set(absolutePath, { mtimeMs: stats.mtimeMs, result })
  return result
}

export function invalidateMarkdownCache(requestPath: string) {
  try {
    const absolutePath = normalizeContentPath(requestPath)
    cache.delete(absolutePath)
  } catch (error) {
    // ignore invalid paths during invalidation
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to invalidate markdown cache:', error)
    }
  }
}

export function clearMarkdownCache() {
  cache.clear()
}

export { ContentNotFoundError }
