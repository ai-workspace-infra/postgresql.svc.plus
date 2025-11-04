'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { Layout, ReactGridLayoutProps } from 'react-grid-layout'

interface WorkspacePanel {
  id: string
  domId?: string
  content: ReactNode
  minW?: number
  minH?: number
}

interface WorkspaceGridProps {
  layout: Layout[]
  defaultLayout: Layout[]
  panels: WorkspacePanel[]
  onLayoutChange: (layout: Layout[]) => void
  draggableHandle?: string
}

const ReactGridLayout = dynamic<ReactGridLayoutProps>(
  () =>
    import('react-grid-layout').then(mod => {
      const baseComponent = mod.default
      const widthProvider = mod.WidthProvider ?? mod.default?.WidthProvider

      if (!widthProvider) {
        throw new Error('Unable to load react-grid-layout WidthProvider')
      }

      return widthProvider(baseComponent)
    }),
  { ssr: false }
)

export function WorkspaceGrid({
  layout,
  defaultLayout,
  panels,
  onLayoutChange,
  draggableHandle
}: WorkspaceGridProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const mergedLayout = useMemo(() => {
    const defaultsById = Object.fromEntries(defaultLayout.map(item => [item.i, item]))
    return layout.map(item => ({
      ...defaultsById[item.i],
      ...item
    }))
  }, [defaultLayout, layout])

  if (!mounted) {
    return <div className="grid gap-4 md:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl bg-slate-900/60" /><div className="h-64 animate-pulse rounded-2xl bg-slate-900/60" /></div>
  }

  return (
    <div className="insight-grid">
      <ReactGridLayout
        layout={mergedLayout}
        cols={12}
        rowHeight={36}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        draggableHandle={draggableHandle}
        onLayoutChange={onLayoutChange}
        compactType={null}
        isBounded
        useCSSTransforms
      >
        {panels.map(panel => (
          <div key={panel.id} id={panel.domId}>
            <div className="h-full">{panel.content}</div>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  )
}
