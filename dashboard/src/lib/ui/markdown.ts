import 'server-only'

import type { ContentCommitMeta } from '@server/content-meta'
import { getContentCommitMeta } from '@server/content-meta'
import type { MarkdownRenderResult } from '@server/render-markdown'
import { renderMarkdownFile } from '@server/render-markdown'

export async function loadMarkdownSection(path: string): Promise<MarkdownRenderResult> {
  return renderMarkdownFile(path)
}

export async function loadContentMeta(path: string): Promise<ContentCommitMeta> {
  return getContentCommitMeta(path)
}
