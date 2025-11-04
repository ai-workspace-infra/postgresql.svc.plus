import { marked } from 'marked'

export default async function MarkdownPanel({ url, title }: { url: string; title: string }) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const text = await res.text()
    const html = marked.parse(text)
    return (
      <div className="rounded-2xl shadow p-4">
        <h2 className="font-semibold mb-2">{title}</h2>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  } catch {
    return null
  }
}
