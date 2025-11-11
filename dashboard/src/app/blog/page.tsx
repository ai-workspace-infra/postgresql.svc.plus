export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getHomepagePosts } from '@cms/content'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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

type PageProps = {
  searchParams: { page?: string }
}

export default async function BlogPage({ searchParams }: PageProps) {
  const posts = await getHomepagePosts()
  const { page } = await searchParams
  const postsPerPage = 10
  const currentPage = parseInt(page || '1', 10)
  const totalPages = Math.ceil(posts.length / postsPerPage)

  if (currentPage < 1 || currentPage > totalPages) {
    notFound()
  }

  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const paginatedPosts = posts.slice(startIndex, endIndex)

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
          <>
            <div className="grid gap-8">
              {paginatedPosts.map((post) => (
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
                      href={`/blog/${post.slug}`}
                      className="ml-auto text-sm font-semibold text-brand transition hover:text-brand-dark"
                    >
                      Read more →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2">
                <Link
                  href={`/blog?page=${currentPage - 1}`}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                    currentPage === 1
                      ? 'cursor-not-allowed text-slate-400'
                      : 'text-brand hover:bg-slate-100'
                  }`}
                  aria-disabled={currentPage === 1}
                >
                  Previous
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={`/blog?page=${page}`}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                      page === currentPage
                        ? 'bg-brand text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </Link>
                ))}

                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                    currentPage === totalPages
                      ? 'cursor-not-allowed text-slate-400'
                      : 'text-brand hover:bg-slate-100'
                  }`}
                  aria-disabled={currentPage === totalPages}
                >
                  Next
                </Link>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}
