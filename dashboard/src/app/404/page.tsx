export const dynamic = 'error'

import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">404</p>
      <h1 className="mt-4 text-4xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-gray-600">
        The page you were looking for could not be generated during the static export. Please return to the homepage and try a
        different link.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700"
      >
        Back to homepage
      </Link>
    </main>
  )
}
