/**
 * Zustand stores for dashboard state management
 *
 * This module provides global state management using Zustand.
 * Stores are designed to work with both Fresh SSR and client-side islands.
 */

import { create } from 'zustand'

/**
 * UI State Store
 * Manages global UI state like sidebar, theme, etc.
 */
interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'auto'
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: 'auto',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}))

/**
 * User State Store
 * Manages user authentication and profile data
 */
interface UserState {
  user: {
    id?: string
    email?: string
    name?: string
  } | null
  isAuthenticated: boolean
  setUser: (user: UserState['user']) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

/**
 * Template State Store
 * Manages template selection and metadata
 */
interface TemplateState {
  selectedTemplateId: string | null
  templates: Array<{ id: string; name: string; category: string }>
  setSelectedTemplate: (id: string | null) => void
  setTemplates: (templates: TemplateState['templates']) => void
}

export const useTemplateStore = create<TemplateState>((set) => ({
  selectedTemplateId: null,
  templates: [],
  setSelectedTemplate: (id) => set({ selectedTemplateId: id }),
  setTemplates: (templates) => set({ templates }),
}))

/**
 * Content State Store
 * Manages content/document state
 */
interface ContentState {
  currentDocSlug: string | null
  searchQuery: string
  setCurrentDocSlug: (slug: string | null) => void
  setSearchQuery: (query: string) => void
}

export const useContentStore = create<ContentState>((set) => ({
  currentDocSlug: null,
  searchQuery: '',
  setCurrentDocSlug: (slug) => set({ currentDocSlug: slug }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
