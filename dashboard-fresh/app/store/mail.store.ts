'use client'

import { create } from 'zustand'

interface MailState {
  tenantId: string | null
  selectedMessageId: string | null
  label: string | null
  search: string
  pageSize: number
  cursor: string | null
  setTenant: (tenantId: string) => void
  setSelectedMessageId: (id: string | null) => void
  setLabel: (label: string | null) => void
  setSearch: (term: string) => void
  setCursor: (cursor: string | null) => void
  setPageSize: (size: number) => void
  reset: () => void
}

const DEFAULT_STATE: Omit<MailState, 'setTenant' | 'setSelectedMessageId' | 'setLabel' | 'setSearch' | 'setCursor' | 'setPageSize' | 'reset'> = {
  tenantId: null,
  selectedMessageId: null,
  label: null,
  search: '',
  pageSize: 25,
  cursor: null,
}

export const useMailStore = create<MailState>((set) => ({
  ...DEFAULT_STATE,
  setTenant: (tenantId: string) =>
    set((state) => ({
      ...DEFAULT_STATE,
      tenantId,
      search: state.search,
    })),
  setSelectedMessageId: (id) => set({ selectedMessageId: id }),
  setLabel: (label) =>
    set((state) => ({
      label,
      cursor: null,
      selectedMessageId: state.selectedMessageId,
    })),
  setSearch: (term) =>
    set((state) => ({
      search: term,
      cursor: null,
      selectedMessageId: state.selectedMessageId,
    })),
  setCursor: (cursor) => set({ cursor }),
  setPageSize: (size) => set({ pageSize: size }),
  reset: () => set(DEFAULT_STATE),
}))
