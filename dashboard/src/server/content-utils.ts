import fs from 'node:fs/promises'
import path from 'node:path'

export class ContentNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentNotFoundError'
  }
}

const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content')

export function getContentRoot(): string {
  return CONTENT_ROOT
}

export function normalizeContentPath(requestPath: string): string {
  if (!requestPath) {
    throw new Error('Missing content path')
  }
  const normalizedRequest = requestPath.replace(/\\/g, '/').replace(/^\/+/, '')
  const resolvedPath = path.join(CONTENT_ROOT, normalizedRequest)
  const normalizedAbsolute = path.normalize(resolvedPath)
  if (!normalizedAbsolute.startsWith(CONTENT_ROOT)) {
    throw new Error('Invalid content path')
  }
  return normalizedAbsolute
}

export async function assertContentFile(requestPath: string): Promise<string> {
  const absolutePath = normalizeContentPath(requestPath)
  try {
    const stats = await fs.stat(absolutePath)
    if (!stats.isFile()) {
      throw new ContentNotFoundError(`Content file not found: ${requestPath}`)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ContentNotFoundError(`Content file not found: ${requestPath}`)
    }
    throw error
  }
  return absolutePath
}

export function toContentRelativePath(absolutePath: string): string {
  return path.relative(CONTENT_ROOT, absolutePath)
}
