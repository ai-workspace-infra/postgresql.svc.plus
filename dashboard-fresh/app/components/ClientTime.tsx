'use client'

import { useMemo } from 'react'

type ClientTimeProps = {
  isoString: string
  locale?: string
  options?: Intl.DateTimeFormatOptions
  fallback?: string
}

function formatTimestamp(
  isoString: string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
  fallback?: string,
): { display: string; dateTime: string } {
  if (!isoString) {
    return { display: fallback ?? '--', dateTime: '' }
  }

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return { display: fallback ?? isoString, dateTime: isoString }
  }

  const formatter = new Intl.DateTimeFormat(locale ?? undefined, options)
  return { display: formatter.format(date), dateTime: date.toISOString() }
}

export default function ClientTime({ isoString, locale, options, fallback }: ClientTimeProps) {
  const { display, dateTime } = useMemo(
    () => formatTimestamp(isoString, locale, options, fallback),
    [isoString, locale, options, fallback],
  )

  return <time dateTime={dateTime || undefined}>{display}</time>
}
