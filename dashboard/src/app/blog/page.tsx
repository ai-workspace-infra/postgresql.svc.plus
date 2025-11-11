import Link from 'next/link'
import { getHomepagePosts } from '@cms/content'
import { useLanguage } from '@/i18n/LanguageProvider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Cloud-Neutral',
  description: 'Latest updates, releases, and insights from the Cloud-Neutral community.',
}

function formatDate(dateStr: string | undefined, language: 'zh' | 'en'): string {
  if (!dateStr) return ''

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

export default async function BlogPage() {
  const posts = await getHomepagePosts()

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Blog</h1>
          <p className="text-lg text-slate-600">
            Latest updates, releases, and insights from the Cloud-Neutral community.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500">暂无博客文章</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand">Blog</span>
                  {post.date && (
                    <time className="text-sm text-slate-500">
                      {formatDate(post.date, 'en')}
                    </time>
                  )}
                </div>
                <h2 className="mb-4 text-2xl font-bold text-slate-900">{post.title}</h2>
                {post.author && (
                  <p className="mb-4 text-sm text-slate-500">By {post.author}</p>
                )}
                <p className="mb-6 text-slate-600">{post.excerpt}</p>
                <div className="flex items-center gap-4">
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/blog"
                    className="ml-auto text-sm font-semibold text-brand transition hover:text-brand-dark"
                  >
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
