import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MarkdownSection, { type MarkdownRenderResult } from '@components/MarkdownSection'

describe('MarkdownSection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders prefetched content and notifies listeners', () => {
    const prefetched: MarkdownRenderResult = {
      path: 'homepage/intro.md',
      html: '<p>Prefetched body</p>',
      meta: { title: 'Intro Title', heading: 'h3' },
    }
    const onMetaChange = vi.fn()

    const { container } = render(
      <MarkdownSection src="homepage/intro.md" prefetched={prefetched} onMetaChange={onMetaChange} />
    )

    expect(screen.getByRole('region', { name: 'Intro Title' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Intro Title' })).toBeInTheDocument()
    expect(container.querySelector('.prose')).toHaveTextContent('Prefetched body')
    expect(onMetaChange).toHaveBeenCalledWith(prefetched.meta)
  })

  it('fetches markdown content when no prefetched data is provided', async () => {
    const response: MarkdownRenderResult = {
      path: 'homepage/features.md',
      html: '<p>Loaded from network</p>',
      meta: { title: 'Loaded Title', heading: 'h4' },
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    })
    vi.stubGlobal('fetch', fetchMock)
    const onMetaChange = vi.fn()

    render(
      <MarkdownSection src="homepage/features.md" onMetaChange={onMetaChange} />
    )

    expect(screen.getByText('Loading content…')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 4, name: 'Loaded Title' })).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/render-markdown?path=homepage%2Ffeatures.md', expect.any(Object))
    expect(onMetaChange).toHaveBeenCalledWith(response.meta)
    expect(screen.queryByText('Loading content…')).not.toBeInTheDocument()
  })

  it('shows the error fallback when the fetch fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Something went wrong' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<MarkdownSection src="homepage/features.md" />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load content.')).toBeInTheDocument()
    })

    expect(screen.queryByText('Loading content…')).not.toBeInTheDocument()
  })
})
