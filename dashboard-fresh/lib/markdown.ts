import { promises as fs } from 'fs'
import path from 'path'
import { marked } from 'marked'

export type FrontMatterValue = string | string[]

export interface MarkdownFile {
  metadata: Record<string, FrontMatterValue>
  content: string
  html: string
  slug: string
}

const CONTENT_ROOT = path.join(process.cwd(), 'content')

function normalizeQuotes(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function parseFrontMatter(raw: string): {
  metadata: Record<string, FrontMatterValue>
  content: string
} {
  const frontMatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!frontMatterMatch) {
    return { metadata: {}, content: raw.trim() }
  }

  const [, frontMatter, body] = frontMatterMatch
  const metadata: Record<string, FrontMatterValue> = {}
  let currentKey: string | null = null

  const lines = frontMatter.split(/\r?\n/)
  for (const line of lines) {
    if (!line.trim()) {
      continue
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (keyValueMatch) {
      const [, key, value] = keyValueMatch
      currentKey = key
      if (!value || value.trim() === '') {
        metadata[key] = []
        continue
      }

      metadata[key] = normalizeQuotes(value)
      continue
    }

    if (currentKey && line.trim().startsWith('- ')) {
      const normalizedValue = normalizeQuotes(line.trim().slice(2))
      const currentValue = metadata[currentKey]
      if (Array.isArray(currentValue)) {
        currentValue.push(normalizedValue)
      } else if (typeof currentValue === 'string') {
        metadata[currentKey] = [currentValue, normalizedValue]
      } else {
        metadata[currentKey] = [normalizedValue]
      }
    }
  }

  return {
    metadata,
    content: body.trim(),
  }
}

export async function readMarkdownFile(
  relativePath: string,
  options?: { baseDir?: string }
): Promise<MarkdownFile> {
  const baseDir = options?.baseDir ?? CONTENT_ROOT
  const filePath = path.join(baseDir, relativePath)
  const raw = await fs.readFile(filePath, 'utf-8')
  const { metadata, content } = parseFrontMatter(raw)
  const htmlResult = await marked.parse(content)
  const html = typeof htmlResult === 'string' ? htmlResult : await htmlResult
  const slug = path.basename(relativePath, path.extname(relativePath))

  return { metadata, content, html, slug }
}

export async function readMarkdownDirectory(
  relativeDir: string,
  options?: { baseDir?: string }
): Promise<MarkdownFile[]> {
  const baseDir = options?.baseDir ?? CONTENT_ROOT
  const dirPath = path.join(baseDir, relativeDir)
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))

  const results = await Promise.all(
    files.map((file) => readMarkdownFile(path.join(relativeDir, file.name), { baseDir }))
  )

  return results
}
