export type ThemeName = 'light' | 'dark'

export type ThemePreference = ThemeName | 'system'

export interface ThemeTokens {
  colors: Record<string, string>
  gradients: Record<string, string>
  shadows: Record<string, string>
  radii: Record<string, string>
}

export interface ThemeDefinition {
  name: ThemeName
  colorScheme: 'light' | 'dark'
  tokens: ThemeTokens
}
