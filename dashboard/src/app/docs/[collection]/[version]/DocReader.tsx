'use client'

import {
  ComponentProps,
  ReactElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import DOMPurify from 'dompurify'

import type { DocViewOption } from './DocViewSection'

export interface DocTocItem {
  id: string
  title: string
  level: number
  type: 'html' | 'pdf'
  targetId?: string
  pageNumber?: number
}

export interface DocReaderHandle {
  scrollToAnchor: (item: DocTocItem) => void
}

interface DocReaderProps {
  docTitle: string
  view?: DocViewOption
  onTocChange: (items: DocTocItem[]) => void
  onProgressChange: (value: number) => void
  onActiveAnchorChange: (id: string | null) => void
}

type LoadingState = 'idle' | 'loading' | 'error'

interface PdfModule {
  Document: typeof import('react-pdf').Document
  Page: typeof import('react-pdf').Page
}

type DocumentComponent = PdfModule['Document']
type OnLoadSuccess = NonNullable<ComponentProps<DocumentComponent>['onLoadSuccess']>
type PdfDocument = Parameters<OnLoadSuccess>[0]

const HTML_ENCODINGS = ['utf-8', 'utf-16le', 'utf-16be', 'gb18030']

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'

const decodeBuffer = (buffer: ArrayBuffer, encodings: string[]): string => {
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: true })
      return decoder.decode(buffer)
    } catch {
      continue
    }
  }
  const decoder = new TextDecoder()
  return decoder.decode(buffer)
}

const buildHtmlToc = (container: HTMLElement): DocTocItem[] => {
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  return headings.map((heading, index) => {
    const rawTitle = heading.textContent?.trim() || `Section ${index + 1}`
    const baseId = slugify(rawTitle)
    const headingId = heading.getAttribute('id') || `${baseId}-${index}`
    heading.setAttribute('id', headingId)
    heading.setAttribute('data-doc-heading', 'true')
    const level = Number(heading.tagName.replace('H', ''))
    return {
      id: headingId,
      title: rawTitle,
      level: Number.isNaN(level) ? 2 : level,
      type: 'html' as const,
      targetId: headingId,
    }
  })
}

type PdfOutline = {
  title: string
  dest?: unknown
  items?: PdfOutline[]
}

type PdfRef = { num: number; gen: number }

const isPdfRef = (value: unknown): value is PdfRef =>
  typeof value === 'object' &&
  value !== null &&
  'num' in value &&
  'gen' in value &&
  typeof (value as { num: unknown }).num === 'number' &&
  typeof (value as { gen: unknown }).gen === 'number'

const buildPdfToc = async (pdf: PdfDocument): Promise<DocTocItem[]> => {
  const outline = ((await pdf.getOutline()) as PdfOutline[]) ?? []

  const flattenOutline = async (items: PdfOutline[] | undefined, level = 1): Promise<DocTocItem[]> => {
    if (!items || !items.length) {
      return []
    }
    const result: DocTocItem[] = []
    for (const item of items) {
      if (!item) continue
      let pageNumber: number | undefined
      if (item.dest) {
        try {
          let ref: unknown
          if (typeof item.dest === 'string') {
            const destination = await pdf.getDestination(item.dest)
            ref = Array.isArray(destination) ? destination[0] : destination
          } else if (Array.isArray(item.dest)) {
            const [first] = item.dest
            ref = first
          } else {
            ref = item.dest
          }
          if (isPdfRef(ref)) {
            pageNumber = (await pdf.getPageIndex(ref)) + 1
          } else if (typeof ref === 'number') {
            pageNumber = ref + 1
          }
        } catch {
          // ignore resolution errors
        }
      }
      const id = `${slugify(item.title || 'page')}-${level}-${result.length}`
      result.push({
        id,
        title: item.title || 'Untitled section',
        level,
        type: 'pdf',
        pageNumber,
      })
      if (item.items?.length) {
        const children = await flattenOutline(item.items, Math.min(level + 1, 6))
        result.push(...children)
      }
    }
    return result
  }

  const toc = await flattenOutline(outline, 1)
  if (toc.length) {
    return toc
  }

  const fallback: DocTocItem[] = []
  const numPages = pdf.numPages
  for (let page = 1; page <= numPages; page += 1) {
    fallback.push({
      id: `pdf-page-${page}`,
      title: `Page ${page}`,
      level: 2,
      type: 'pdf',
      pageNumber: page,
    })
  }
  return fallback
}

const DocReader = forwardRef<DocReaderHandle, DocReaderProps>(
  ({ docTitle, view, onTocChange, onProgressChange, onActiveAnchorChange }, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null)
    const htmlContainerRef = useRef<HTMLDivElement | null>(null)
    const [htmlContent, setHtmlContent] = useState<string>('')
    const [loadingState, setLoadingState] = useState<LoadingState>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pdfModule, setPdfModule] = useState<PdfModule | null>(null)
    const [numPages, setNumPages] = useState<number>(0)
    const [containerWidth, setContainerWidth] = useState<number | null>(null)
    const pdfDocumentRef = useRef<PdfDocument | null>(null)
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
    const tocItemsRef = useRef<DocTocItem[]>([])

    const currentViewId = view?.id
    const resolvedViewUrl = view?.viewerUrl ?? view?.url ?? null

    useEffect(() => {
      onTocChange([])
      onActiveAnchorChange(null)
      onProgressChange(0)
      setHtmlContent('')
      setErrorMessage(null)
      setNumPages(0)
      pageRefs.current.clear()
      pdfDocumentRef.current = null
      tocItemsRef.current = []
      if (view) {
        if (!resolvedViewUrl) {
          setErrorMessage('Document source is unavailable for this format.')
          setLoadingState('error')
          return
        }
        setLoadingState('loading')
      } else {
        setLoadingState('idle')
      }
    }, [view, resolvedViewUrl, onTocChange, onActiveAnchorChange, onProgressChange])

    useEffect(() => {
      if (!view || view.id !== 'html') {
        return
      }
      const targetUrl = view.viewerUrl ?? view.url
      if (!targetUrl) {
        return
      }
      let cancelled = false
      const controller = new AbortController()
      const load = async () => {
        try {
          const response = await fetch(targetUrl, { signal: controller.signal })
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`)
          }
          const buffer = await response.arrayBuffer()
          const contentType = response.headers.get('content-type') || ''
          const charsetMatch = /charset=([^;]+)/i.exec(contentType)
          const encodings = [...HTML_ENCODINGS]
          if (charsetMatch) {
            const charset = charsetMatch[1].trim().toLowerCase()
            if (charset && !encodings.includes(charset)) {
              encodings.unshift(charset)
            }
          }
          const html = decodeBuffer(buffer, encodings)
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const body = doc.body || doc.createElement('body')
          const tocItems = buildHtmlToc(body)
          if (cancelled) return
          const sanitized = DOMPurify.sanitize(body.innerHTML, {
            ADD_ATTR: ['data-doc-heading'],
            USE_PROFILES: { html: true },
          })
          setHtmlContent(sanitized)
          tocItemsRef.current = tocItems
          onTocChange(tocItems)
          setLoadingState('idle')
          if (tocItems.length) {
            onActiveAnchorChange(tocItems[0].id)
          }
        } catch (error) {
          if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) {
            return
          }
          setErrorMessage('Unable to load HTML content for this document.')
          setLoadingState('error')
        }
      }
      load()
      return () => {
        cancelled = true
        controller.abort()
      }
    }, [view, resolvedViewUrl, onTocChange, onActiveAnchorChange])

    useEffect(() => {
      if (!view || view.id !== 'pdf') {
        setPdfModule(null)
        return
      }
      let cancelled = false
      const load = async () => {
        try {
          const mod = await import('react-pdf')
          mod.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.pdfjs.version}/pdf.worker.min.js`
          if (!cancelled) {
            setPdfModule({ Document: mod.Document, Page: mod.Page })
          }
        } catch (error) {
          if (cancelled) return
          setErrorMessage('Unable to initialise the PDF renderer.')
          setLoadingState('error')
        }
      }
      load()
      return () => {
        cancelled = true
      }
    }, [view])

    const handlePdfLoadSuccess = useCallback<OnLoadSuccess>(
      (pdf) => {
        pdfDocumentRef.current = pdf
        setNumPages(pdf.numPages)
        setLoadingState('idle')
        void (async () => {
          try {
            const tocItems = await buildPdfToc(pdf)
            tocItemsRef.current = tocItems
            onTocChange(tocItems)
            if (tocItems.length) {
              onActiveAnchorChange(tocItems[0].id)
            }
          } catch {
            const fallback: DocTocItem[] = []
            for (let page = 1; page <= pdf.numPages; page += 1) {
              fallback.push({
                id: `pdf-page-${page}`,
                title: `Page ${page}`,
                level: 2,
                type: 'pdf',
                pageNumber: page,
              })
            }
            tocItemsRef.current = fallback
            onTocChange(fallback)
            if (fallback.length) {
              onActiveAnchorChange(fallback[0].id)
            }
          }
        })()
      },
      [onTocChange, onActiveAnchorChange],
    )

    const registerPageRef = useCallback((pageNumber: number, element: HTMLDivElement | null) => {
      if (!element) {
        pageRefs.current.delete(pageNumber)
        return
      }
      pageRefs.current.set(pageNumber, element)
    }, [])

    useEffect(() => {
      const container = scrollContainerRef.current
      if (!container) return

      const updateProgress = () => {
        if (!container) return
        const { scrollTop, scrollHeight, clientHeight } = container
        const denominator = scrollHeight - clientHeight
        if (denominator <= 0) {
          onProgressChange(1)
          return
        }
        const nextValue = Math.min(Math.max(scrollTop / denominator, 0), 1)
        onProgressChange(Number.isFinite(nextValue) ? nextValue : 0)
      }

      updateProgress()
      container.addEventListener('scroll', updateProgress)
      return () => {
        container.removeEventListener('scroll', updateProgress)
      }
    }, [onProgressChange, currentViewId])

    useEffect(() => {
      const container = scrollContainerRef.current
      if (!container) return
      const observer = new ResizeObserver(() => {
        const { scrollHeight, clientHeight } = container
        if (scrollHeight <= clientHeight) {
          onProgressChange(1)
        }
      })
      observer.observe(container)
      return () => {
        observer.disconnect()
      }
    }, [onProgressChange, currentViewId])

    useEffect(() => {
      if (!view || view.id !== 'html') return
      const container = scrollContainerRef.current
      if (!container) return
      const headings = Array.from(container.querySelectorAll<HTMLElement>('[data-doc-heading="true"]'))
      if (!headings.length) return
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          if (visible[0]) {
            onActiveAnchorChange(visible[0].target.id)
          }
        },
        {
          root: container,
          threshold: [0.1, 0.25, 0.4],
          rootMargin: '0px 0px -40% 0px',
        },
      )
      headings.forEach((heading) => observer.observe(heading))
      return () => {
        headings.forEach((heading) => observer.unobserve(heading))
        observer.disconnect()
      }
    }, [view, htmlContent, onActiveAnchorChange])

    useEffect(() => {
      if (!view || view.id !== 'pdf') return
      const container = scrollContainerRef.current
      if (!container) return
      const pages = Array.from(pageRefs.current.values())
      if (!pages.length) return
      const observer = new IntersectionObserver(
        (entries) => {
          const topEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
          if (topEntry) {
            const pageNumber = Number((topEntry.target as HTMLElement).dataset.pageNumber)
            if (Number.isFinite(pageNumber)) {
              const tocMatch = tocItemsRef.current.find((item) => item.pageNumber === pageNumber)
              onActiveAnchorChange(tocMatch?.id ?? `pdf-page-${pageNumber}`)
            }
          }
        },
        {
          root: container,
          threshold: [0.2, 0.4],
          rootMargin: '0px 0px -45% 0px',
        },
      )
      pages.forEach((page) => observer.observe(page))
      return () => {
        pages.forEach((page) => observer.unobserve(page))
        observer.disconnect()
      }
    }, [view, numPages, onActiveAnchorChange])

    useEffect(() => {
      const container = htmlContainerRef.current
      if (!container) return
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) {
          setContainerWidth(entry.contentRect.width)
        }
      })
      observer.observe(container)
      return () => {
        observer.disconnect()
      }
    }, [view, htmlContent])

    useImperativeHandle(
      ref,
      () => ({
        scrollToAnchor: (item: DocTocItem) => {
          const container = scrollContainerRef.current
          if (!container) return
          if (item.type === 'html' && item.targetId) {
            const escapedId =
              typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(item.targetId) : item.targetId.replace(/\s+/g, '\\ ')
            const target = container.querySelector<HTMLElement>(`#${escapedId}`)
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }
          if (item.type === 'pdf' && item.pageNumber) {
            const page = pageRefs.current.get(item.pageNumber)
            if (page) {
              page.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }
        },
      }),
      [],
    )

    const renderHtmlContent = useMemo(() => {
      if (!htmlContent) return null
      return (
        <div
          className="doc-html-content space-y-6 text-sm leading-relaxed text-gray-700 [&_a]:text-purple-600 [&_a:hover]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-purple-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:mt-3 [&_h5]:text-base [&_h5]:font-semibold [&_h6]:mt-3 [&_h6]:text-sm [&_h6]:font-semibold [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:text-gray-700 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:text-xs [&_pre]:text-gray-100 [&_strong]:font-semibold [&_table]:w-full [&_table]:table-auto [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )
    }, [htmlContent])

    const renderPdfContent = () => {
      if (!pdfModule || !view || view.id !== 'pdf') {
        return null
      }
      const targetUrl = view.viewerUrl ?? view.url
      if (!targetUrl) {
        return (
          <div className="py-10 text-center text-sm text-gray-500">
            We could not locate the PDF source for this document.
          </div>
        )
      }
      const { Document, Page } = pdfModule
      const width = containerWidth ? Math.min(containerWidth - 32, 960) : undefined
      return (
        <Document
          file={{ url: targetUrl }}
          onLoadSuccess={handlePdfLoadSuccess}
          onLoadError={() => {
            setErrorMessage('Unable to load the PDF document.')
            setLoadingState('error')
          }}
          loading={<div className="py-10 text-center text-sm text-gray-500">Loading PDF…</div>}
          error={
            <div className="py-10 text-center text-sm text-red-500">Unable to load the PDF document.</div>
          }
        >
          {Array.from({ length: numPages }).map((_, index) => (
            <div
              key={index + 1}
              ref={(element) => registerPageRef(index + 1, element)}
              data-page-number={index + 1}
              className="mb-8 flex justify-center"
            >
              <Page pageNumber={index + 1} width={width} renderAnnotationLayer renderTextLayer />
            </div>
          ))}
        </Document>
      )
    }

    let content: ReactElement | null = null
    if (!view) {
      content = (
        <div className="py-10 text-center text-sm text-gray-500">
          Select a format on the left to begin reading this document.
        </div>
      )
    } else if (loadingState === 'loading') {
      content = (
        <div className="py-10 text-center text-sm text-gray-500">
          Preparing {view.label} view for “{docTitle}”…
        </div>
      )
    } else if (loadingState === 'error') {
      content = (
        <div className="py-10 text-center text-sm text-red-500">{errorMessage}</div>
      )
    } else if (view.id === 'html') {
      content = renderHtmlContent ?? (
        <div className="py-10 text-center text-sm text-gray-500">
          We could not extract readable HTML content from this resource.
        </div>
      )
    } else if (view.id === 'pdf') {
      content = renderPdfContent()
    }

    return (
      <div className="relative flex h-full flex-col">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-8" aria-live="polite">
          <div ref={htmlContainerRef}>{content}</div>
        </div>
      </div>
    )
  },
)

DocReader.displayName = 'DocReader'

export default DocReader

