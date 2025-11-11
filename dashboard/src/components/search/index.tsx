'use client'

import { FormEvent, useState } from 'react'
import clsx from 'clsx'
import { Search } from 'lucide-react'

import { AskAIDialog } from '../AskAIDialog'
import { useLanguage } from '../i18n/LanguageProvider'

type SearchComponentProps = {
  className?: string
  inputClassName?: string
  buttonClassName?: string
  variant?: 'default' | 'hero'
}

type PendingQuestion = { key: number; text: string }

const baseWrapperClass = 'relative w-full max-w-xs'
const heroWrapperClass = 'relative w-full max-w-2xl'

const baseInputClass =
  'w-full rounded-full border border-brand-border bg-brand-surface/60 py-2 pl-4 pr-10 text-sm text-brand-heading transition focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20'
const heroInputClass =
  'w-full rounded-full border border-brand-border bg-white/80 py-3 pl-5 pr-12 text-base text-brand-heading shadow-sm transition focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20'

const baseButtonClass =
  'absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-light'
const heroButtonClass =
  'absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:bg-brand-light'

export default function SearchComponent({
  className,
  inputClassName,
  buttonClassName,
  variant = 'default'
}: SearchComponentProps) {
  const { language } = useLanguage()
  const [searchValue, setSearchValue] = useState('')
  const [askDialogOpen, setAskDialogOpen] = useState(false)
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null)

  const placeholder =
    language === 'zh' ? '请输入关键字搜索内容' : 'Ask anything about your docs'

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = searchValue.trim()
    if (!trimmed) return
    setPendingQuestion({ key: Date.now(), text: trimmed })
    setAskDialogOpen(true)
    setSearchValue('')
  }

  const wrapperClasses = clsx(variant === 'hero' ? heroWrapperClass : baseWrapperClass, className)
  const inputClasses = clsx(variant === 'hero' ? heroInputClass : baseInputClass, inputClassName)
  const submitButtonClasses = clsx(
    variant === 'hero' ? heroButtonClass : baseButtonClass,
    buttonClassName
  )

  return (
    <>
      <form onSubmit={handleSearchSubmit} className={wrapperClasses}>
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={placeholder}
          className={inputClasses}
        />
        <button type="submit" className={submitButtonClasses} aria-label="Ask AI">
          <Search className={variant === 'hero' ? 'h-5 w-5' : 'h-4 w-4'} />
        </button>
      </form>
      <AskAIDialog
        open={askDialogOpen}
        onMinimize={() => setAskDialogOpen(false)}
        onEnd={() => {
          setAskDialogOpen(false)
          setPendingQuestion(null)
        }}
        initialQuestion={pendingQuestion ?? undefined}
      />
    </>
  )
}
