'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { darkTheme } from './dark'
import { lightTheme } from './light'
import type { ThemeDefinition, ThemeName, ThemePreference, ThemeTokens } from './types'

const STORAGE_KEY = 'xcontrol:theme-preference'

const themeRegistry: Record<ThemeName, ThemeDefinition> = {
  light: lightTheme,
  dark: darkTheme,
}

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

function applyTheme(definition: ThemeDefinition) {
  if (typeof document === 'undefined') {
    return
  }

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

function resolveSystemTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export interface ThemeProviderProps {
  children: React.ReactNode
  initialPreference?: ThemePreference
}

export function ThemeProvider({ children, initialPreference = 'system' }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference)
  const [theme, setTheme] = useState<ThemeName>(
    initialPreference === 'system' ? resolveSystemTheme() : initialPreference,
  )
  const hasLoadedPreferenceRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedPreference = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null
    if (storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'system') {
      setPreferenceState(storedPreference)
      setTheme(storedPreference === 'system' ? resolveSystemTheme() : storedPreference)
      hasLoadedPreferenceRef.current = true
      return
    }

    if (!hasLoadedPreferenceRef.current && initialPreference === 'system') {
      setTheme(resolveSystemTheme())
      setPreferenceState('system')
    }
    hasLoadedPreferenceRef.current = true
  }, [initialPreference])

  useEffect(() => {
    if (preference === 'system') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
        setTheme(resolveSystemTheme())
      }
      return
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, preference)
    }
    setTheme(preference)
  }, [preference])

  useEffect(() => {
    applyTheme(themeRegistry[theme])
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme((current) => {
        if (preference === 'system') {
          return event.matches ? 'dark' : 'light'
        }
        return current
      })
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [preference])

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference)
  }, [])

  const toggleTheme = useCallback(() => {
    setPreferenceState((current) => {
      if (current === 'system') {
        return theme === 'light' ? 'dark' : 'light'
      }
      return current === 'light' ? 'dark' : 'light'
    })
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      tokens: themeRegistry[theme].tokens,
      colorScheme: themeRegistry[theme].colorScheme,
      availableThemes: Object.keys(themeRegistry) as ThemeName[],
      setPreference,
      toggleTheme,
    }),
    [preference, setPreference, theme, toggleTheme],
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
