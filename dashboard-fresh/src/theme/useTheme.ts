import { useMemo } from 'react'

import { useThemeContext } from './ThemeProvider'
import type { ThemeName, ThemePreference, ThemeTokens } from './types'

export interface UseThemeResult {
  theme: ThemeName
  preference: ThemePreference
  tokens: ThemeTokens
  colorScheme: 'light' | 'dark'
  availableThemes: ThemeName[]
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
  isDark: boolean
}

export function useTheme(): UseThemeResult {
  const context = useThemeContext()
  return useMemo(
    () => ({
      ...context,
      isDark: context.theme === 'dark',
    }),
    [context],
  )
}
