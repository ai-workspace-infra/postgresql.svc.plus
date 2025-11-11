import ThemePreferenceCard from '../account/ThemePreferenceCard'

export type ThemeName = 'light' | 'dark'
export type ThemePreference = 'system' | 'light' | 'dark'

export type ThemeDefinition = {
  name: ThemeName
  tokens: {
    colors: Record<string, string>
    shadows: Record<string, string>
  }
}

export type ThemeContextValue = {
  preference: ThemePreference | null
  theme: ThemeName
  setPreference: (preference: ThemePreference) => void
}

// Stub theme definitions for now
export const lightTheme: ThemeDefinition = {
  name: 'light',
  tokens: {
    colors: {
      background: '#ffffff',
      text: '#1f2937',
      'text-subtle': '#6b7280',
      surface: '#f9fafb',
      'surface-elevated': '#ffffff',
      'surface-border': '#e5e7eb',
      'surface-muted': '#f3f4f6',
      primary: '#3b82f6',
      'primary-foreground': '#ffffff',
      'primary-muted': '#dbeafe',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
  },
}

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  tokens: {
    colors: {
      background: '#111827',
      text: '#f9fafb',
      'text-subtle': '#9ca3af',
      surface: '#1f2937',
      'surface-elevated': '#374151',
      'surface-border': '#4b5563',
      'surface-muted': '#1f2937',
      primary: '#60a5fa',
      'primary-foreground': '#1f2937',
      'primary-muted': '#1e3a8a',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    },
  },
}

// Stub useTheme hook
export function useTheme(): ThemeContextValue {
  return {
    preference: 'system',
    theme: 'light',
    setPreference: () => {},
  }
}

export default function UserCenterThemeRoute() {
  return (
    <div className="space-y-6">
      <ThemePreferenceCard />
    </div>
  )
}
