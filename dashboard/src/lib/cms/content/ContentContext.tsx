'use client'

import { createContext, type ReactNode, useContext, useMemo } from 'react'

import { listContentSourcesMetadata } from '../contentSources'

type ContentSourceState = {
  namespace: string
  type: 'filesystem' | 'git'
  repository?: string
  ref?: string
}

const MarkdownContentContext = createContext<ContentSourceState[]>([])

export function MarkdownContentProvider({ children }: { children: ReactNode }) {
  const sources = useMemo(() => {
    return listContentSourcesMetadata()
  }, [])

  return <MarkdownContentContext.Provider value={sources}>{children}</MarkdownContentContext.Provider>
}

export function useMarkdownSources() {
  return useContext(MarkdownContentContext)
}
