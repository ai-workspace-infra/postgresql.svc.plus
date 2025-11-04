/**
 * Content utilities for Fresh + Deno
 *
 * Provides path handling and validation for content files
 */

import { join, normalize, relative } from '$std/path/mod.ts'

export class ContentNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentNotFoundError'
  }
}

const CONTENT_ROOT = join(Deno.cwd(), 'content')

export function getContentRoot(): string {
  return CONTENT_ROOT
}

export function normalizeContentPath(requestPath: string): string {
  if (!requestPath) {
    throw new Error('Missing content path')
  }

  const normalizedRequest = requestPath.replace(/\\/g, '/').replace(/^\/+/, '')
  const resolvedPath = join(CONTENT_ROOT, normalizedRequest)
  const normalizedAbsolute = normalize(resolvedPath)

  if (!normalizedAbsolute.startsWith(CONTENT_ROOT)) {
    throw new Error('Invalid content path')
  }

  return normalizedAbsolute
}

export async function assertContentFile(requestPath: string): Promise<string> {
  const absolutePath = normalizeContentPath(requestPath)

  try {
    const stats = await Deno.stat(absolutePath)
    if (!stats.isFile) {
      throw new ContentNotFoundError(`Content file not found: ${requestPath}`)
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new ContentNotFoundError(`Content file not found: ${requestPath}`)
    }
    throw error
  }

  return absolutePath
}

export function toContentRelativePath(absolutePath: string): string {
  return relative(CONTENT_ROOT, absolutePath)
}
