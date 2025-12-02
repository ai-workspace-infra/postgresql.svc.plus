import { useThemeStore } from './store'
import type { ThemeName, ThemePreference, ThemeTokens } from './types'

export interface UseThemeResult {
  theme: ThemePreference
  preference: ThemePreference
  tokens: ThemeTokens
  colorScheme: 'light' | 'dark'
  availableThemes: ThemeName[]
  setTheme: (preference: ThemePreference) => void
  toggleTheme: () => void
  isDark: boolean
  resolvedTheme: ThemeName
}

export function useTheme(): UseThemeResult {
  const theme = useThemeStore((state) => state.theme)
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const tokens = useThemeStore((state) => state.tokens)
  const colorScheme = useThemeStore((state) => state.colorScheme)
  const availableThemes = useThemeStore((state) => state.availableThemes)
  const setTheme = useThemeStore((state) => state.setTheme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const isDark = useThemeStore((state) => state.isDark)

  return {
    theme,
    preference: theme,
    resolvedTheme,
    tokens,
    colorScheme,
    availableThemes,
    setTheme,
    toggleTheme,
    isDark,
  }
}
