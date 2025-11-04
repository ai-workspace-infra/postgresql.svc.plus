/**
 * Fresh Error Page (500)
 *
 * This page is shown when an internal server error occurs
 */

import { Head } from '$fresh/runtime.ts'

export default function Error500() {
  return (
    <>
      <Head>
        <title>500 - Internal Server Error</title>
      </Head>
      <main class="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-24 text-center">
        <p class="text-sm font-semibold uppercase tracking-wide text-purple-600">
          500
        </p>
        <h1 class="mt-4 text-4xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p class="mt-3 max-w-md text-sm text-gray-600">
          An unexpected error occurred. The incident has been logged and will be
          investigated.
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
