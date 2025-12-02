'use client'

import { useEffect } from 'react'

import { getThemeDefinition, useThemeStore } from './store'
import type { ThemeName, ThemePreference } from './types'

function applyTheme(theme: ThemeName) {
  if (typeof document === 'undefined') {
    return
  }

  const definition = getThemeDefinition(theme)
  const root = document.documentElement
  root.dataset.theme = definition.name
  root.style.setProperty('color-scheme', definition.colorScheme)
  root.classList.toggle('dark', definition.colorScheme === 'dark')

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
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const hydrate = useThemeStore((state) => state.hydrate)
  const setSystemTheme = useThemeStore((state) => state.setSystemTheme)

  useEffect(() => {
    hydrate(initialPreference)
  }, [hydrate, initialPreference])

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

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

  return <>{children}</>
}
