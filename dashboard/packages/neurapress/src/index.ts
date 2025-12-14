import { marked } from 'marked'

const tagBlacklist = [
  'script',
  'iframe',
  'object',
  'embed',
  'style',
]

function stripUnsafe(html: string): string {
  const withoutBlockedTags = tagBlacklist.reduce((current, tag) => {
    const pattern = new RegExp(`<${tag}[^>]*>[\s\S]*?<\/${tag}>`, 'gi')
    return current.replace(pattern, '')
  }, html)

  return withoutBlockedTags
    .replace(/on[a-z]+="[^"]*"/gi, '')
    .replace(/on[a-z]+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { gfm: true, breaks: true })
  if (typeof html !== 'string') {
    return ''
  }
  return stripUnsafe(html)
}

export const neurapressSample = `## 快速上手 / Quick start

- 使用**本地草稿箱**记录灵感，未来版本将支持云端同步
- 支持加粗、斜体、引用、代码块、列表等常见 Markdown 语法
- 右侧预览区会实时展示渲染后的排版

### 代码块

\`\`\`ts
function greet(name: string) {
  return \`Hello, ${'${'}name${'}'}!\`
}

console.log(greet('NeuraPress'))
\`\`\`

### 引用 / Quotes

> 编辑区使用 Markdown，预览区展示渲染结果。
> Keep drafts clear and readable with live preview.

### 链接 / Links

- [NeuraPress upstream](https://github.com/tianyaxiang/neurapress)
- [XControl Dashboard](/dashboard)
`
