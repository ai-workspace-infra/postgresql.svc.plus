import matter from 'gray-matter'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

export type MarkdownRenderOptions = {
  /**
   * Toggle HTML sanitization. Enabled by default to mirror the upstream editor's
   * safety guardrails. Set to `false` only when you fully trust the source.
   */
  sanitize?: boolean
}

export const neurapressSample = `---
title: NeuraPress Markdown Studio
category: Demo
lang: zh-CN
tags:
  - Markdown
  - Draft
  - Preview
---

# NeuraPress / Markdown Studio

> 双语演示 · 中英文并排编辑
>
> Bilingual demo · Chinese + English together

欢迎来到 **NeuraPress** 的在线编辑核心。左侧编辑、右侧实时预览，
无需登录即可体验完整的排版效果。你可以尝试以下能力：

- Front matter 描述文章信息，支持 YAML 语法
- 表格、列表与引用与常规 Markdown 一致
- 代码块高亮，适合技术分享
- 插入图片、外链与脚注

---

## Quickstart / 快速开始

1. 更新标题与摘要，保存为你的草稿
2. 增加图片，使用 \`![alt](https://example.com/image.png)\` 语法
3. 粘贴代码片段，自动渲染为等宽字体
4. 右侧预览对齐微信/公众号常见排版

### Sample content

| Feature        | Description                    | Status |
| -------------- | ------------------------------ | ------ |
| Live preview   | Mirrors NeuraPress formatting  | Ready  |
| Local drafts   | Stored in your browser         | Ready  |
| SaaS sync      | Cloud save for signed-in users | Coming |

> Tip: 长按 Ctrl/⌘ + K 可以快速插入链接。

\`\`\`bash
# Generate a Next.js app that embeds NeuraPress
npx create-next-app@latest my-editor
cd my-editor
npm install @internal/neurapress
npm run dev
\`\`\`
`

export function renderMarkdown(markdown: string, options?: MarkdownRenderOptions): string {
  const { content } = matter(markdown)

  const html = marked.parse(content, { gfm: true, breaks: true })
  const normalized = typeof html === 'string' ? html : String(html)

  if (options?.sanitize === false) {
    return normalized
  }

  return sanitizeHtml(normalized, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      code: ['class'],
      span: ['class'],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  })
}
