/**
 * Fresh App Layout - Root Layout Component
 *
 * This is the root layout that wraps all pages.
 * Equivalent to Next.js app/layout.tsx but using Fresh + Preact.
 */

import { type PageProps } from '$fresh/server.ts'

export default function App({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CloudNative Suite</title>
        <meta
          name="description"
          content="Unified tools for your cloud native stack"
        />
        {/* Load global CSS - Fresh serves static/ as root */}
        <link rel="stylesheet" href="/styles/globals.css" />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body class="bg-[var(--color-background)] text-[var(--color-text)] antialiased">
        <Component />
      </body>
    </html>
  )
}
