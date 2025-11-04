'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { AskAIDialog } from './AskAIDialog'
import { useAccess } from '@lib/accessControl'

export function AskAIButton() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const { allowed, isLoading } = useAccess({ allowGuests: true })

  if (!allowed && !isLoading) {
    return null
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-500 ${
            minimized ? 'w-12 h-12 justify-center' : 'px-4 py-3'
          }`}
        >
          <Bot className="w-5 h-5" />
          {!minimized && 'Ask AI'}
        </button>
      )}

      <AskAIDialog
        open={open}
        onMinimize={() => {
          setOpen(false)
          setMinimized(true)
        }}
        onEnd={() => {
          setOpen(false)
          setMinimized(false)
        }}
      />
    </>
  )
}
