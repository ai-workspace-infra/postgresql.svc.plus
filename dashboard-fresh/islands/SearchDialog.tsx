/**
 * Search Dialog Island - Fresh + Preact
 *
 * Client-side interactive search dialog with keyboard shortcuts
 */

import { useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'

interface SearchDialogProps {
  language: 'zh' | 'en'
}

export default function SearchDialog({ language }: SearchDialogProps) {
  const isOpen = useSignal(false)
  const query = useSignal('')
  const inputRef = useRef<HTMLInputElement>(null)

  const openDialog = () => {
    isOpen.value = true
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const closeDialog = () => {
    isOpen.value = false
    query.value = ''
  }

  const handleSearch = (e: Event) => {
    e.preventDefault()
    if (query.value.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(query.value)}`
    }
  }

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen.value) {
          closeDialog()
        } else {
          openDialog()
        }
      }
      if (e.key === 'Escape' && isOpen.value) {
        closeDialog()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const placeholder = language === 'zh'
    ? '搜索文档、产品...'
    : 'Search docs, products...'

  return (
    <>
      {/* Search Button */}
      <button
        onClick={openDialog}
        class="hidden md:flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition"
        aria-label="Search"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>{language === 'zh' ? '搜索' : 'Search'}</span>
        <kbd class="hidden lg:inline-block px-2 py-0.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Mobile Search Button */}
      <button
        onClick={openDialog}
        class="md:hidden p-2 text-gray-700 hover:text-gray-900"
        aria-label="Search"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Search Dialog */}
      {isOpen.value && (
        <>
          {/* Backdrop */}
          <div
            class="fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={closeDialog}
          />

          {/* Dialog Panel */}
          <div class="fixed inset-x-4 top-20 z-50 max-w-2xl mx-auto">
            <div class="bg-white rounded-lg shadow-2xl">
              {/* Search Input */}
              <form onSubmit={handleSearch} class="relative">
                <div class="flex items-center px-4 py-3 border-b border-gray-200">
                  <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query.value}
                    onInput={(e) => query.value = (e.target as HTMLInputElement).value}
                    placeholder={placeholder}
                    class="flex-1 ml-3 bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={closeDialog}
                    class="text-gray-400 hover:text-gray-600"
                  >
                    <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                      ESC
                    </kbd>
                  </button>
                </div>
              </form>

              {/* Quick Links / Recent Searches */}
              <div class="px-4 py-3 max-h-96 overflow-y-auto">
                {query.value.trim() === '' ? (
                  <div class="space-y-2">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {language === 'zh' ? '快速链接' : 'Quick Links'}
                    </p>
                    <a href="/docs" class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                      {language === 'zh' ? '📚 文档中心' : '📚 Documentation'}
                    </a>
                    <a href="/download" class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                      {language === 'zh' ? '⬇️ 下载' : '⬇️ Downloads'}
                    </a>
                    <a href="/demo" class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                      {language === 'zh' ? '🎮 演示' : '🎮 Demo'}
                    </a>
                  </div>
                ) : (
                  <div class="text-sm text-gray-500 text-center py-8">
                    {language === 'zh'
                      ? `按 Enter 搜索 "${query.value}"`
                      : `Press Enter to search for "${query.value}"`
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
