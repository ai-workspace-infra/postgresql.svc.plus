import type { CmsExtension } from '../types'
import { MarkdownContentProvider } from '../content/ContentContext'

export const markdownSyncExtension: CmsExtension = {
  name: 'markdown-sync',
  providers: [MarkdownContentProvider],
}
