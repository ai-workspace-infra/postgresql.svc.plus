'use client'

import { useMemo } from 'react'

import Card from '../components/Card'
import { darkTheme, lightTheme, useTheme } from '@components/theme'
import type { ThemeDefinition, ThemeName, ThemePreference } from '@components/theme'

const THEME_OPTIONS: Array<{
  value: ThemePreference
  label: string
  description: string
}> = [
  {
    value: 'system',
    label: '跟随系统',
    description: '自动匹配浏览器或操作系统的主题设置。',
  },
  {
    value: 'light',
    label: '浅色模式',
    description: '明亮的界面，适合在白天或光线充足的环境使用。',
  },
  {
    value: 'dark',
    label: '深色模式',
    description: '降低屏幕亮度，减轻夜间或低光环境下的视觉疲劳。',
  },
]

const PREVIEW_DEFINITIONS: Record<ThemeName, ThemeDefinition> = {
  light: lightTheme,
  dark: darkTheme,
}

function ThemePreview({ definition, active }: { definition: ThemeDefinition; active: boolean }) {
  const { tokens, name } = definition
  const colors = tokens.colors
  const shadows = tokens.shadows

  return (
    <div
      className={`flex flex-col gap-3 rounded-[var(--radius-xl)] border p-4 text-sm transition-colors ${
        active
          ? 'border-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)]'
          : 'border-[color:var(--color-surface-border)] opacity-90'
      }`}
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        boxShadow: active ? shadows.sm : 'none',
      }}
      aria-label={`${name} theme preview`}
    >
      <div
        className="rounded-[var(--radius-lg)] px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: colors['surface-elevated'],
          color: colors.text,
          boxShadow: shadows.sm,
        }}
      >
        {name === 'light' ? 'Light header' : 'Dark header'}
      </div>
      <div
        className="rounded-[var(--radius-lg)] border p-4"
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: colors['surface-border'],
          boxShadow: shadows.sm,
        }}
      >
        <p style={{ color: colors['text-subtle'] }}>统一的卡片背景与文本样式。</p>
        <div className="mt-3 inline-flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: colors['primary-muted'],
              color: colors.primary,
            }}
          >
            Badge
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: colors['surface-muted'],
              color: colors.text,
            }}
          >
            Surface
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div style={{ color: colors['text-subtle'] }}>Primary Action</div>
          <div
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-medium"
            style={{
              backgroundColor: colors.primary,
              color: colors['primary-foreground'],
              boxShadow: shadows.sm,
            }}
          >
            {name === 'light' ? '亮色按钮' : '暗色按钮'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ThemePreferenceCard() {
  const { preference, theme, setPreference } = useTheme()

  const normalizedPreference = useMemo<ThemePreference>(() => preference ?? 'system', [preference])

  return (
    <Card className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">主题偏好</h2>
        <p className="text-sm text-[var(--color-text-subtle)]">
          在这里选择浅色、深色或跟随系统的配色方案。该设置会立即作用于控制台和演示示例。
        </p>
      </div>

      <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] p-2">
        <div className="flex flex-col gap-2 md:flex-row">
          {THEME_OPTIONS.map((option) => {
            const isSelected = normalizedPreference === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPreference(option.value)}
                className={`flex flex-1 flex-col items-start gap-2 rounded-[var(--radius-xl)] border px-4 py-4 text-left transition-all md:min-h-[140px] ${
                  isSelected
                    ? 'border-[color:var(--color-primary)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-md)] dark:bg-[color:var(--color-surface-elevated)]'
                    : 'border-transparent text-[var(--color-text-subtle)] hover:border-[color:var(--color-primary-border)] hover:text-[var(--color-primary)]'
                }`}
              >
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-xs leading-relaxed text-[var(--color-text-subtle)] opacity-80">
                  {option.description}
                </span>
                {option.value === 'system' && preference === 'system' ? (
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-subtle)] opacity-80">
                    当前匹配：{theme === 'dark' ? '深色' : '浅色'}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(Object.keys(PREVIEW_DEFINITIONS) as ThemeName[]).map((name) => {
          const definition = PREVIEW_DEFINITIONS[name]
          return <ThemePreview key={name} definition={definition} active={theme === name} />
        })}
      </div>
    </Card>
  )
}
