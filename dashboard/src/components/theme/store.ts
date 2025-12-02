import { create } from 'zustand'

import { darkTheme } from './dark'
import { lightTheme } from './light'
import type { ThemeDefinition, ThemeName, ThemePreference, ThemeTokens } from './types'

const STORAGE_KEY = 'xcontrol:theme-preference'

const themeRegistry: Record<ThemeName, ThemeDefinition> = {
  light: lightTheme,
  dark: darkTheme,
}

const availableThemes = Object.keys(themeRegistry) as ThemeName[]

function resolveSystemTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredPreference(defaultPreference: ThemePreference): ThemePreference {
  if (typeof window === 'undefined') {
    return defaultPreference
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }

  return defaultPreference
}

function persistPreference(preference: ThemePreference) {
  if (typeof window === 'undefined') {
    return
  }

  if (preference === 'system') {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, preference)
}

function buildThemeState(preference: ThemePreference, theme: ThemeName): ThemeState {
  const definition = themeRegistry[theme]
  return {
    preference,
    theme,
    tokens: definition.tokens,
    colorScheme: definition.colorScheme,
    availableThemes,
  }
}

export type ThemeState = {
  preference: ThemePreference
  theme: ThemeName
  tokens: ThemeTokens
  colorScheme: 'light' | 'dark'
  availableThemes: ThemeName[]
}

export type ThemeActions = {
  hydrate: (initialPreference: ThemePreference) => void
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
  setSystemTheme: (theme: ThemeName) => void
}

export const useThemeStore = create<ThemeState & ThemeActions>((set, get) => ({
  ...buildThemeState('system', resolveSystemTheme()),
  hydrate: (initialPreference) => {
    const preference = readStoredPreference(initialPreference)
    const resolvedTheme = preference === 'system' ? resolveSystemTheme() : preference
    set(buildThemeState(preference, resolvedTheme))
  },
  setPreference: (preference) => {
    const resolvedTheme = preference === 'system' ? resolveSystemTheme() : preference
    persistPreference(preference)
    set(buildThemeState(preference, resolvedTheme))
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light'
    get().setPreference(nextTheme)
  },
  setSystemTheme: (theme) => {
    set((state) => {
      if (state.preference !== 'system') {
        return state
      }
      return buildThemeState('system', theme)
    })
  },
}))

export function getThemeDefinition(theme: ThemeName): ThemeDefinition {
  return themeRegistry[theme]
}
