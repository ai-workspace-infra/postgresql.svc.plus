'use client'

import ThemePreferenceCard from '../../panel/account/ThemePreferenceCard'
import Card from '../../panel/components/Card'
import { useTheme } from '@theme'
import type { ThemeTokens } from '@theme'

const COLOR_TOKENS: Array<{ key: keyof ThemeTokens['colors']; label: string }> = [
  { key: 'background', label: '背景 Background' },
  { key: 'surface', label: '表面 Surface' },
  { key: 'surface-muted', label: '次级表面 Muted surface' },
  { key: 'text', label: '正文 Text' },
  { key: 'text-subtle', label: '辅助文本 Muted text' },
  { key: 'primary', label: '主色 Primary' },
  { key: 'primary-muted', label: '主色衬底 Primary muted' },
  { key: 'primary-foreground', label: '主色文字 Primary foreground' },
]

export default function ThemeShowcasePage() {
  const { theme, tokens } = useTheme()
  const { colors } = tokens

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 text-[var(--color-text)] transition-colors sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-primary)]">Theme system</p>
        <h1 className="text-3xl font-bold text-[var(--color-heading)]">主题演示与调试</h1>
        <p className="max-w-3xl text-sm text-[var(--color-text-subtle)]">
          当前主题：<span className="font-semibold text-[var(--color-text)]">{theme}</span>。使用下方卡片可以即时切换主题，并查看核心设计 token 的取值情况，帮助校验多主题下的界面一致性。
        </p>
      </header>

      <ThemePreferenceCard />

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">当前主题 token</h2>
        <p className="text-sm text-[var(--color-text-subtle)]">
          这些颜色变量会注入到 <code className="rounded bg-[var(--color-surface-muted)] px-2 py-1 text-xs">document.documentElement</code> 上，可用于 Tailwind
          CSS 的自定义颜色或手写样式。
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLOR_TOKENS.map(({ key, label }) => {
            const value = colors[key]
            return (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-text-subtle)]"
              >
                <span className="font-semibold text-[var(--color-text)]">{label}</span>
                <span
                  className="rounded-[var(--radius-lg)] border border-[color:var(--color-surface-border)] px-3 py-6"
                  style={{ backgroundColor: value }}
                />
                <span className="font-mono text-[var(--color-text-subtle)] opacity-80">{value}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
