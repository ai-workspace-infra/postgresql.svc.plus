import 'server-only'

import type { ContentCommitMeta } from '../../api/content-meta'
import { getContentCommitMeta } from '../../api/content-meta'
import type { MarkdownRenderResult } from '../../api/render-markdown'
import { renderMarkdownFile } from '../../api/render-markdown'

export async function loadMarkdownSection(path: string): Promise<MarkdownRenderResult> {
  return renderMarkdownFile(path)
}

export async function loadContentMeta(path: string): Promise<ContentCommitMeta> {
  return getContentCommitMeta(path)
}
