'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { AskAIDialog } from './AskAIDialog'
import { useAccess } from '@lib/accessControl'

type AskAIButtonProps = {
  variant?: 'floating' | 'navbar'
}

export function AskAIButton({ variant = 'floating' }: AskAIButtonProps) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const { allowed, isLoading } = useAccess({ allowGuests: true })
  const isFloating = variant === 'floating'
  const isNavbar = variant === 'navbar'

  if (!allowed && !isLoading) {
    return null
  }

  const handleOpen = () => setOpen(true)
  const handleMinimize = () => {
    setOpen(false)
    if (isFloating) {
      setMinimized(true)
    }
  }
  const handleEnd = () => {
    setOpen(false)
    setMinimized(false)
  }

  const buttonClassName = isFloating
    ? `fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-purple-600 text-white shadow-lg transition hover:bg-purple-500 ${
        minimized ? 'h-12 w-12 justify-center' : 'px-4 py-3'
      }`
    : 'flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-indigo-100 transition hover:border-indigo-300/50 hover:bg-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-300/60 focus:ring-offset-2 focus:ring-offset-slate-900'

  const showTrigger = isFloating ? !open : true

  return (
    <>
      {showTrigger ? (
        <button type="button" onClick={handleOpen} className={buttonClassName} aria-expanded={open} aria-label="Ask AI">
          <Bot className="h-4 w-4" />
          {!isNavbar && (!minimized || !isFloating) && <span className="text-sm">Ask AI</span>}
        </button>
      ) : null}

      <AskAIDialog open={open} onMinimize={handleMinimize} onEnd={handleEnd} />
    </>
  )
}
