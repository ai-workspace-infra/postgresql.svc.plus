/**
 * Signals-based stores for dashboard state management
 *
 * This module provides global state management using Preact Signals.
 * Stores are designed to work with both Fresh SSR and client-side islands.
 */

import { signal } from '@preact/signals'

/**
 * UI State Store
 * Manages global UI state like sidebar, theme, etc.
 */
const sidebarOpenSignal = signal(false)
const themeSignal = signal<'light' | 'dark' | 'auto'>('auto')

export const useUIStore = () => ({
  sidebarOpen: sidebarOpenSignal.value,
  theme: themeSignal.value,
  toggleSidebar: () => {
    sidebarOpenSignal.value = !sidebarOpenSignal.value
  },
  setTheme: (theme: 'light' | 'dark' | 'auto') => {
    themeSignal.value = theme
  },
})

/**
 * User State Store
 * Manages user authentication and profile data
 */
const userSignal = signal<{
  id?: string
  email?: string
  name?: string
} | null>(null)

export const useUserStore = () => ({
  user: userSignal.value,
  isAuthenticated: !!userSignal.value,
  setUser: (user: typeof userSignal.value) => {
    userSignal.value = user
  },
  logout: () => {
    userSignal.value = null
  },
})

/**
 * Template State Store
 * Manages template selection and metadata
 */
const selectedTemplateIdSignal = signal<string | null>(null)
const templatesSignal = signal<Array<{ id: string; name: string; category: string }>>([])

export const useTemplateStore = () => ({
  selectedTemplateId: selectedTemplateIdSignal.value,
  templates: templatesSignal.value,
  setSelectedTemplate: (id: string | null) => {
    selectedTemplateIdSignal.value = id
  },
  setTemplates: (templates: typeof templatesSignal.value) => {
    templatesSignal.value = templates
  },
})

/**
 * Content State Store
 * Manages content/document state
 */
const currentDocSlugSignal = signal<string | null>(null)
const searchQuerySignal = signal('')

export const useContentStore = () => ({
  currentDocSlug: currentDocSlugSignal.value,
  searchQuery: searchQuerySignal.value,
  setCurrentDocSlug: (slug: string | null) => {
    currentDocSlugSignal.value = slug
  },
  setSearchQuery: (query: string) => {
    searchQuerySignal.value = query
  },
})
