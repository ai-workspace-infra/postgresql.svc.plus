import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readMarkdownFile } from '@lib/markdown'
import type { Metadata } from 'next'

type PageProps = {
  params: { slug: string }
}

function formatDate(dateStr: string, language: 'zh' | 'en'): string {
  const date = new Date(dateStr)

  if (language === 'zh') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const blogContentRoot = process.cwd() + '/src/content/blog'
    const file = await readMarkdownFile(`${slug}.md`, { baseDir: blogContentRoot })

    const title = file.metadata.title as string
    const excerpt = (file.metadata.excerpt as string) || ''

    return {
      title: `${title} | Cloud-Neutral Blog`,
      description: excerpt,
    }
  } catch (error) {
    return {
      title: 'Blog Post | Cloud-Neutral',
    }
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  try {
    const blogContentRoot = process.cwd() + '/src/content/blog'
    const file = await readMarkdownFile(`${slug}.md`, { baseDir: blogContentRoot })

    const title = (file.metadata.title as string) || slug
    const author = file.metadata.author as string | undefined
    const date = file.metadata.date as string | undefined
    const tags = file.metadata.tags as string[] | undefined

    return (
      <main className="flex min-h-screen flex-col bg-slate-50">
        <div className="mx-auto w-full max-w-4xl px-4 py-16">
          {/* Back to blog link */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center text-sm font-semibold text-brand transition hover:text-brand-dark"
          >
            ← {date ? 'Back to Blog' : '返回博客'}
          </Link>

          {/* Article header */}
          <header className="mb-12">
            <h1 className="mb-4 text-4xl font-bold text-slate-900 sm:text-5xl">
              {title}
            </h1>

            {author && (
              <p className="mb-2 text-sm text-slate-600">
                {date ? 'By' : '作者'} {author}
              </p>
            )}

            {date && (
              <time className="text-sm text-slate-500">
                {formatDate(date, 'en')}
              </time>
            )}

            {tags && tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Article content */}
          <article
            className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:text-brand prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: file.html }}
          />

          {/* Footer */}
          <footer className="mt-16 border-t border-slate-200 pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm font-semibold text-brand transition hover:text-brand-dark"
            >
              ← Back to Blog
            </Link>
          </footer>
        </div>
      </main>
    )
  } catch (error) {
    notFound()
  }
}
