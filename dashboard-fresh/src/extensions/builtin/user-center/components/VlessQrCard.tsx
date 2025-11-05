'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Copy, Download, QrCode } from 'lucide-preact'
import { toDataURL } from 'qrcode'

import Card from './Card'
import {
  buildVlessConfig,
  buildVlessUri,
  DEFAULT_VLESS_LABEL,
  serializeConfigForDownload,
} from '../lib/vless'

export type VlessQrCopy = {
  label: string
  description: string
  linkLabel: string
  linkHelper: string
  copyLink: string
  copied: string
  downloadQr: string
  downloadConfig: string
  generating: string
  error: string
  missingUuid: string
  downloadTooltip: string
  qrAlt: string
}

interface VlessQrCardProps {
  uuid: string | null | undefined
  copy: VlessQrCopy
}

export default function VlessQrCard({ uuid, copy }: VlessQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const vlessUri = useMemo(() => buildVlessUri(uuid), [uuid])

  useEffect(() => {
    let cancelled = false

    if (!vlessUri) {
      setQrDataUrl(null)
      setGenerationError(null)
      return () => {
        cancelled = true
      }
    }

    setIsGenerating(true)
    setGenerationError(null)
    toDataURL(vlessUri, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 8,
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('Failed to generate VLESS QR code', error)
          setGenerationError(copy.error)
          setQrDataUrl(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsGenerating(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [copy.error, vlessUri])

  const handleCopyLink = useCallback(async () => {
    if (!vlessUri) {
      return
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(vlessUri)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = vlessUri
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.warn('Failed to copy VLESS link', error)
    }
  }, [vlessUri])

  const handleDownloadQr = useCallback(() => {
    if (!qrDataUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = 'vless-qr.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [qrDataUrl])

  const handleDownloadConfig = useCallback(() => {
    const config = buildVlessConfig(uuid)
    if (!config) {
      return
    }

    const contents = serializeConfigForDownload(config)
    const blob = new Blob([contents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'xray-client-config.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }, [uuid])

  const isReady = Boolean(vlessUri && qrDataUrl && !generationError)
  const isDisabled = !vlessUri

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{copy.label}</p>
            <span className="rounded-full bg-[var(--color-primary-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              {DEFAULT_VLESS_LABEL}
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-subtle)]">{copy.description}</p>
        </div>

        {vlessUri ? (
          <>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg border border-[color:var(--color-surface-border)] bg-[var(--color-surface)]">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-[var(--color-text-subtle)]">
                    <QrCode className="h-6 w-6 opacity-60" />
                    <span>{copy.generating}</span>
                  </div>
                ) : generationError ? (
                  <div className="px-4 text-center text-xs text-[var(--color-text-subtle)]">{generationError}</div>
                ) : qrDataUrl ? (
                  <Image
                    src={qrDataUrl}
                    alt={copy.qrAlt}
                    width={160}
                    height={160}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-2 text-xs text-[var(--color-text-subtle)]">
                <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface-muted)] p-3 text-[11px] text-[var(--color-text)]">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">{copy.linkLabel}</p>
                  <p className="font-mono text-xs text-[var(--color-text-subtle)]">{copy.linkHelper}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={isDisabled}
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-primary-border)] px-3 py-2 text-xs font-medium text-[var(--color-primary)] transition-colors hover:border-[color:var(--color-primary)] hover:bg-[var(--color-primary-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? copy.copied : copy.copyLink}
              </button>
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!isReady}
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-surface-border)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[color:var(--color-primary-border)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <QrCode className="h-3.5 w-3.5" />
                {copy.downloadQr}
              </button>
              <button
                type="button"
                onClick={handleDownloadConfig}
                disabled={isDisabled}
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-surface-border)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[color:var(--color-primary-border)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                title={copy.downloadTooltip}
                aria-label={copy.downloadTooltip}
              >
                <Download className="h-3.5 w-3.5" />
                {copy.downloadConfig}
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-[var(--color-text-subtle)]">{copy.missingUuid}</p>
        )}
      </div>
    </Card>
  )
}
