/**
 * Fresh 404 Page
 *
 * This page is shown when a route is not found
 */

import { Head } from '$fresh/runtime.ts'

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      <main class="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-24 text-center">
        <p class="text-sm font-semibold uppercase tracking-wide text-purple-600">
          404
        </p>
        <h1 class="mt-4 text-4xl font-bold text-gray-900">
          Page not found
        </h1>
        <p class="mt-3 max-w-md text-sm text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <a
          href="/"
          class="mt-6 inline-flex items-center rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700"
        >
          Back to homepage
        </a>
      </main>
    </>
  )
}
