export function formatDate(date: string, locale?: string): string {
  return new Date(date).toLocaleString(locale)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDuration(range: string) {
  if (!range) return 'custom'
  const match = range.match(/^(\d+)([smhdw])$/)
  if (!match) return range
  const [, value, unit] = match
  const dictionary: Record<string, string> = {
    s: 'seconds',
    m: 'minutes',
    h: 'hours',
    d: 'days',
    w: 'weeks'
  }
  return `${value} ${dictionary[unit] ?? unit}`
}

export function formatNumber(value: number, digits = 2) {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(digits)}B`
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(digits)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(digits)}K`
  return value.toFixed(digits)
}

export function getLogLevelColor(level: string) {
  switch (level.toLowerCase()) {
    case 'error':
      return 'text-red-400'
    case 'warn':
    case 'warning':
      return 'text-amber-300'
    case 'info':
      return 'text-blue-300'
    case 'debug':
      return 'text-emerald-300'
    default:
      return 'text-slate-300'
  }
}
