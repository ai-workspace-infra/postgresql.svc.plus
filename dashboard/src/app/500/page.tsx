import Link from 'next/link'

export default function ErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">500</p>
      <h1 className="mt-4 text-4xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-gray-600">
        An unexpected error occurred while preparing this static page. The incident has been logged and will be investigated.
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
