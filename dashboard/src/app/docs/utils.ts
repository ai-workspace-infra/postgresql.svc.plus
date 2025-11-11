const DEFAULT_DOCS_BASE_URL = 'https://dl.svc.plus/docs'

const normalizeBaseUrl = (value?: string) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.replace(/\/$/, '')
}

const docsBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_DOCS_BASE_URL) || DEFAULT_DOCS_BASE_URL

export const DOCS_BASE_URL = docsBaseUrl

export const buildAbsoluteDocUrl = (value?: string) => {
  if (!value || typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (!docsBaseUrl) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }

  try {
    const base = new URL(docsBaseUrl.endsWith('/') ? docsBaseUrl : `${docsBaseUrl}/`)
    const basePath = base.pathname.replace(/\/+$/, '')
    const basePathWithoutLeadingSlash = basePath.replace(/^\/+/, '')

    let relative = trimmed.replace(/^\/+/, '')

    if (
      basePathWithoutLeadingSlash &&
      relative.toLowerCase().startsWith(`${basePathWithoutLeadingSlash.toLowerCase()}/`)
    ) {
      relative = relative.slice(basePathWithoutLeadingSlash.length + 1)
    }

    return new URL(relative || '.', base).toString()
  } catch {
    const ensureLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return `${docsBaseUrl.replace(/\/+$/, '')}${ensureLeadingSlash}`
  }
}
