'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Monitor,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react'

import DocReader, { type DocReaderHandle, type DocTocItem } from './DocReader'

export type ViewMode = 'pdf' | 'html'

export interface DocViewOption {
  id: ViewMode
  label: string
  description: string
  url: string
  viewerUrl?: string
  icon: ViewMode
}

const ICON_MAP: Record<ViewMode, typeof FileText> = {
  pdf: FileText,
  html: Monitor,
}

interface DocViewSectionProps {
  docTitle: string
  options: DocViewOption[]
}

export default function DocViewSection({ docTitle, options }: DocViewSectionProps) {
  const [activeId, setActiveId] = useState<ViewMode | undefined>(options[0]?.id)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [formatsCollapsed, setFormatsCollapsed] = useState(false)
  const [tocCollapsed, setTocCollapsed] = useState(false)
  const [tocItems, setTocItems] = useState<DocTocItem[]>([])
  const [progress, setProgress] = useState(0)
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)
  const readerRef = useRef<DocReaderHandle | null>(null)

  useEffect(() => {
    if (!options.length) {
      setActiveId(undefined)
      return
    }
    if (!activeId || !options.some((option) => option.id === activeId)) {
      setActiveId(options[0].id)
    }
  }, [options, activeId])

  const activeView = useMemo(() => {
    if (!options.length) return undefined
    return options.find((option) => option.id === activeId) ?? options[0]
  }, [options, activeId])

  const ActiveIcon = activeView ? ICON_MAP[activeView.icon] : undefined

  const handleTocClick = (item: DocTocItem) => {
    readerRef.current?.scrollToAnchor(item)
  }

  const activeAnchorLabel = useMemo(() => {
    if (!activeAnchor) return ''
    const match = tocItems.find((item) => item.id === activeAnchor)
    if (match) {
      if (match.type === 'pdf' && match.pageNumber) {
        return `${match.title} • 第 ${match.pageNumber} 页`
      }
      return match.title
    }
    if (activeView?.id === 'pdf' && activeAnchor.startsWith('pdf-page-')) {
      const page = Number(activeAnchor.replace('pdf-page-', ''))
      if (Number.isFinite(page)) {
        return `第 ${page} 页`
      }
    }
    return ''
  }, [activeAnchor, tocItems, activeView])

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
      <div className="space-y-3">
        {sidebarCollapsed ? (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-purple-400 hover:text-purple-600"
          >
            <PanelLeft className="h-4 w-4" /> 显示阅读侧栏
          </button>
        ) : (
          <aside className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">阅读模式</p>
                <p className="text-sm font-semibold text-gray-800">格式与目录</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                <PanelLeftClose className="h-4 w-4" /> 隐藏
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setFormatsCollapsed((value) => !value)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-gray-800 hover:text-purple-600"
                >
                  <span>阅读格式</span>
                  {formatsCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {!formatsCollapsed && (
                  <div className="space-y-2 border-t border-gray-100 p-3">
                    {options.length === 0 && (
                      <p className="text-xs text-gray-500">暂无可用格式。</p>
                    )}
                    {options.map((view) => {
                      const isActive = activeView?.id === view.id
                      const Icon = ICON_MAP[view.icon]
                      return (
                        <button
                          key={view.id}
                          type="button"
                          onClick={() => setActiveId(view.id)}
                          className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                            isActive
                              ? 'border-purple-500 bg-purple-50/70 text-purple-700 shadow'
                              : 'border-transparent hover:border-purple-200 hover:bg-purple-50'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              isActive ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="space-y-1">
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              {view.label}
                              {isActive && <span className="text-xs font-medium text-purple-600">当前</span>}
                            </span>
                            <span className="text-xs text-gray-500">{view.description}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setTocCollapsed((value) => !value)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-gray-800 hover:text-purple-600"
                >
                  <span>内容目录</span>
                  {tocCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {!tocCollapsed && (
                  <div className="max-h-[50vh] space-y-1 overflow-y-auto border-t border-gray-100 p-3 text-sm">
                    {tocItems.length === 0 ? (
                      <p className="text-xs text-gray-500">当前格式暂未提供目录。</p>
                    ) : (
                      tocItems.map((item) => {
                        const isActive = activeAnchor === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleTocClick(item)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                              isActive
                                ? 'bg-purple-100/80 text-purple-700'
                                : 'hover:bg-purple-50 hover:text-purple-700'
                            }`}
                            style={{ paddingLeft: `${Math.min(item.level - 1, 4) * 12 + 12}px` }}
                          >
                            <span className="truncate text-sm">{item.title}</span>
                            {item.type === 'pdf' && item.pageNumber && (
                              <span className="ml-2 text-xs text-gray-400">P{item.pageNumber}</span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="flex min-h-[70vh] flex-col gap-4">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {ActiveIcon && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <ActiveIcon className="h-4 w-4" />
                </span>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">当前阅读格式</p>
                <p className="text-sm font-semibold text-gray-800">
                  {activeView ? `${activeView.label}` : '请选择阅读格式'}
                </p>
              </div>
            </div>
            {activeView && (
              <a
                href={activeView.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-purple-400 hover:text-purple-600"
              >
                <ExternalLink className="h-4 w-4" /> 全屏沉浸式模式
              </a>
            )}
          </div>

          <DocReader
            ref={readerRef}
            docTitle={docTitle}
            view={activeView}
            onTocChange={setTocItems}
            onProgressChange={setProgress}
            onActiveAnchorChange={setActiveAnchor}
          />

          <div className="border-t border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>阅读进度</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-purple-600 transition-all duration-300"
                style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
              />
            </div>
            {activeAnchorLabel && (
              <p className="mt-2 text-xs text-gray-500">当前章节：{activeAnchorLabel}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
