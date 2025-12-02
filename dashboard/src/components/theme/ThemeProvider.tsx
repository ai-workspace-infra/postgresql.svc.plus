'use client'

import { createContext, useContext, useEffect, useMemo } from 'react'

import { getThemeDefinition, useThemeStore } from './store'
import type { ThemeName, ThemePreference, ThemeTokens } from './types'

interface ThemeContextValue {
  theme: ThemeName
  preference: ThemePreference
  tokens: ThemeTokens
  colorScheme: 'light' | 'dark'
  availableThemes: ThemeName[]
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyTheme(theme: ThemeName) {
  if (typeof document === 'undefined') {
    return
  }

  const definition = getThemeDefinition(theme)
  const root = document.documentElement
  root.dataset.theme = definition.name
  root.style.setProperty('color-scheme', definition.colorScheme)

  const body = document.body
  if (body) {
    body.dataset.theme = definition.name
    body.style.setProperty('color-scheme', definition.colorScheme)
  }

  const { colors, gradients, shadows, radii } = definition.tokens
  for (const [token, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${token}`, value)
  }
  for (const [token, value] of Object.entries(gradients)) {
    root.style.setProperty(`--gradient-${token}`, value)
  }
  for (const [token, value] of Object.entries(shadows)) {
    root.style.setProperty(`--shadow-${token}`, value)
  }
  for (const [token, value] of Object.entries(radii)) {
    root.style.setProperty(`--radius-${token}`, value)
  }
}

export interface ThemeProviderProps {
  children: React.ReactNode
  initialPreference?: ThemePreference
}

export function ThemeProvider({ children, initialPreference = 'system' }: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme)
  const preference = useThemeStore((state) => state.preference)
  const tokens = useThemeStore((state) => state.tokens)
  const colorScheme = useThemeStore((state) => state.colorScheme)
  const availableThemes = useThemeStore((state) => state.availableThemes)
  const setPreference = useThemeStore((state) => state.setPreference)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const hydrate = useThemeStore((state) => state.hydrate)
  const setSystemTheme = useThemeStore((state) => state.setSystemTheme)

  useEffect(() => {
    hydrate(initialPreference)
  }, [hydrate, initialPreference])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }
    handleChange(mediaQuery as unknown as MediaQueryListEvent)
    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [setSystemTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      tokens,
      colorScheme,
      availableThemes,
      setPreference,
      toggleTheme,
    }),
    [availableThemes, colorScheme, preference, setPreference, theme, tokens, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
