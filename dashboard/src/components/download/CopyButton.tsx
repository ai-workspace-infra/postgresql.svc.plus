'use client'

import { Copy } from 'lucide-react'

interface Props {
  text: string
  label: string
}

export default function CopyButton({ text, label }: Props) {
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      console.error('copy failed', e)
    }
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-8 w-8 items-center justify-center rounded border hover:bg-gray-100"
      title={label}
      aria-label={label}
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
