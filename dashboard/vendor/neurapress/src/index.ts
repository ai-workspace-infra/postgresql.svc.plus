import DOMPurify from 'dompurify'
import { marked } from 'marked'

export const neurapressSample = `# NeuraPress Editor

- Markdown-first editing with live preview
- Optimized for WeChat-compatible rich text output
- Extendable storage and publishing pipeline
`

export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { breaks: true }) as string
  return DOMPurify.sanitize(html)
}
