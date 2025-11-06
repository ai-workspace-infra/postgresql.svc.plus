'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { JSX } from 'react'
import clsx from 'clsx'

import type { MarkdownRenderResult } from '../../api/render-markdown'

type MarkdownSectionProps = {
  src: string
  className?: string
  headingLevel?: keyof JSX.IntrinsicElements
  prefetched?: MarkdownRenderResult
  headingClassName?: string
  contentClassName?: string
  onMetaChange?: (meta: Record<string, unknown>) => void
  loadingFallback?: ReactNode
  errorFallback?: ReactNode
}

type MarkdownSectionState = {
  data?: MarkdownRenderResult
  error?: string
  loading: boolean
}

async function fetchMarkdown(path: string): Promise<MarkdownRenderResult> {
  const response = await fetch(`/api/render-markdown?path=${encodeURIComponent(path)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(error ?? `Request failed with status ${response.status}`)
  }

  return (await response.json()) as MarkdownRenderResult
}

function resolveHeading(meta: Record<string, unknown>, fallback: keyof JSX.IntrinsicElements) {
  const allowed = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
  const requested = typeof meta.heading === 'string' ? meta.heading.toLowerCase() : undefined
  return (requested && allowed.has(requested) ? (requested as keyof JSX.IntrinsicElements) : fallback)
}

export default function MarkdownSection({
  src,
  className,
  headingLevel = 'h2',
  prefetched,
  headingClassName,
  contentClassName,
  onMetaChange,
  loadingFallback = <div className="text-sm text-slate-500">Loading content…</div>,
  errorFallback = <div className="text-sm text-red-500">Failed to load content.</div>,
}: MarkdownSectionProps) {
  const initialState: MarkdownSectionState = useMemo(() => {
    if (prefetched && prefetched.path === src) {
      return { data: prefetched, loading: false }
    }
    return { loading: true }
  }, [prefetched, src])

  const [state, setState] = useState<MarkdownSectionState>(initialState)

  useEffect(() => {
    let active = true

    if (prefetched && prefetched.path === src) {
      setState({ data: prefetched, loading: false })
      onMetaChange?.(prefetched.meta)
      return () => {
        active = false
      }
    }

    setState({ loading: true })
    fetchMarkdown(src)
      .then((data) => {
        if (!active) return
        setState({ data, loading: false })
        onMetaChange?.(data.meta)
      })
      .catch((error) => {
        if (!active) return
        setState({ error: error.message, loading: false })
      })

    return () => {
      active = false
    }
  }, [src, prefetched, onMetaChange])

  if (state.loading) {
    return <section className={className}>{loadingFallback}</section>
  }

  if (state.error || !state.data) {
    return <section className={className}>{errorFallback}</section>
  }

  const { meta, html } = state.data
  const title = typeof meta.title === 'string' ? meta.title : undefined
  const resolvedHeading = resolveHeading(meta, headingLevel)

  const HeadingTag = resolvedHeading

  return (
    <section className={className} aria-label={title ?? undefined}>
      {title ? (
        <HeadingTag className={clsx('text-2xl font-semibold text-slate-900', headingClassName)}>
          {title}
        </HeadingTag>
      ) : null}
      <div
        className={clsx('prose prose-slate mt-4 max-w-none', contentClassName)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}

export type { MarkdownRenderResult }
