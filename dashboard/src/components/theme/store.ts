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

function buildThemeState(themePreference: ThemePreference, resolvedTheme: ThemeName): ThemeState {
  const definition = themeRegistry[resolvedTheme]
  return {
    theme: themePreference,
    resolvedTheme,
    tokens: definition.tokens,
    colorScheme: definition.colorScheme,
    availableThemes,
    isDark: resolvedTheme === 'dark',
  }
}

export type ThemeState = {
  theme: ThemePreference
  resolvedTheme: ThemeName
  tokens: ThemeTokens
  colorScheme: 'light' | 'dark'
  availableThemes: ThemeName[]
  isDark: boolean
}

export type ThemeActions = {
  hydrate: (initialPreference: ThemePreference) => void
  setTheme: (theme: ThemePreference) => void
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
  setTheme: (preference) => {
    const resolvedTheme = preference === 'system' ? resolveSystemTheme() : preference
    persistPreference(preference)
    set(buildThemeState(preference, resolvedTheme))
  },
  toggleTheme: () => {
    const { resolvedTheme, setTheme, theme } = get()
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(theme === 'system' ? nextTheme : (theme === 'dark' ? 'light' : 'dark'))
  },
  setSystemTheme: (resolvedTheme) => {
    set((state) => {
      if (state.theme !== 'system') {
        return state
      }
      return buildThemeState('system', resolvedTheme)
    })
  },
}))

export function getThemeDefinition(theme: ThemeName): ThemeDefinition {
  return themeRegistry[theme]
}
