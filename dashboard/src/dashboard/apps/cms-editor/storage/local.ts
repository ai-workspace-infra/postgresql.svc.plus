import { DraftContent, DraftStore } from './index'

const STORAGE_KEY = 'cloudnative-suite.cms-editor.drafts'

const inMemoryFallback: Record<string, DraftContent> = {}

function now() {
  return Date.now()
}

function loadAll(): Record<string, DraftContent> {
  if (typeof window === 'undefined') {
    return inMemoryFallback
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, DraftContent>
    return parsed ?? {}
  } catch (error) {
    console.warn('Failed to read local drafts', error)
    return {}
  }
}

function persist(records: Record<string, DraftContent>) {
  if (typeof window === 'undefined') {
    Object.assign(inMemoryFallback, records)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function generateId() {
  return `local-${Math.random().toString(36).slice(2, 10)}`
}

export const localDraftStore: DraftStore = {
  async list() {
    const drafts = loadAll()
    return Object.values(drafts)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
  },

  async load(id) {
    const drafts = loadAll()
    return drafts[id] ?? null
  },

  async save(input) {
    const drafts = loadAll()
    const id = input.id ?? generateId()
    const updatedAt = now()
    const title = input.title.trim() || 'Untitled'

    drafts[id] = {
      id,
      content: input.content,
      title,
      updatedAt,
    }

    persist(drafts)
    return id
  },

  async remove(id) {
    const drafts = loadAll()
    delete drafts[id]
    persist(drafts)
  },
}
