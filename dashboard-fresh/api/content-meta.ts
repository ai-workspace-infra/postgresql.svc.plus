/**
 * Content metadata utilities for Fresh + Deno
 *
 * Provides git commit information for content files
 */

import { join, dirname, relative, parse } from '$std/path/mod.ts'

import { assertContentFile, ContentNotFoundError, toContentRelativePath } from './content-utils.ts'

export interface ContentCommitMeta {
  path: string
  updatedAt?: string
  author?: string
  message?: string
  commit?: string
}

export async function getContentCommitMeta(requestPath: string): Promise<ContentCommitMeta> {
  const absolutePath = await assertContentFile(requestPath)
  const repoRoot = await findGitRoot(absolutePath)

  if (!repoRoot) {
    return {
      path: toContentRelativePath(absolutePath),
    }
  }

  const relativeToRepo = relative(repoRoot, absolutePath)

  try {
    const command = new Deno.Command('git', {
      args: ['log', '-1', '--pretty=format:%H%x00%ct%x00%an%x00%s', '--', relativeToRepo],
      cwd: repoRoot,
      stdout: 'piped',
      stderr: 'piped',
    })

    const { stdout, stderr, code } = await command.output()

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr)
      if (errorText.includes('unknown revision') || errorText.includes('fatal')) {
        return {
          path: toContentRelativePath(absolutePath),
        }
      }
      throw new Error(`Git command failed: ${errorText}`)
    }

    const output = new TextDecoder().decode(stdout).trim()

    if (!output) {
      return {
        path: toContentRelativePath(absolutePath),
      }
    }

    const [commit, timestamp, author, message] = output.split('\0')
    const updatedAt = timestamp ? new Date(Number(timestamp) * 1000).toISOString() : undefined

    return {
      path: toContentRelativePath(absolutePath),
      commit,
      updatedAt,
      author: author || undefined,
      message: message || undefined,
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new ContentNotFoundError(`Content file not found: ${requestPath}`)
    }
    // If git is not available or other errors, return basic meta
    console.warn('[content-meta] Git command failed:', error)
    return {
      path: toContentRelativePath(absolutePath),
    }
  }
}

async function findGitRoot(filePath: string): Promise<string | null> {
  let currentDir = dirname(filePath)
  const root = parse(currentDir).root

  while (currentDir && currentDir !== root) {
    try {
      const gitPath = join(currentDir, '.git')
      const stat = await Deno.stat(gitPath)
      if (stat.isDirectory) {
        return currentDir
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error
      }
    }
    currentDir = dirname(currentDir)
  }

  return null
}

export { ContentNotFoundError }
