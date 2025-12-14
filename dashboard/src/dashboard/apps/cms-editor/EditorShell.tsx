'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@i18n/LanguageProvider'
import { neurapressSample, renderMarkdown } from '../../../../vendor/neurapress/src'
import type { DraftStore } from './storage'

const defaultContent = `# 编辑器 / Editor

欢迎体验 NeuraPress 编辑器内核。本地模式下草稿仅存储在浏览器，后续版本会支持登录后同步到云端。

- 内置示例帮助你快速排版
- 实时预览，适配公众号/富文本复制
- 当前版本为本地草稿箱，未来支持 SaaS 云端存储

---

# Markdown Studio (NeuraPress)

This editor keeps your drafts in the browser today. Cloud sync for signed-in accounts is planned.

- Start from the template below
- Preview in real time
- Prepare for future SaaS sync

${neurapressSample}`

type EditorShellProps = {
  store: DraftStore
  fallbackStore?: DraftStore
  mode: 'public' | 'dashboard'
}

type HydrationState = 'loading' | 'ready' | 'error'

export default function EditorShell({ store, fallbackStore, mode }: EditorShellProps) {
  const { language } = useLanguage()
  const isChinese = language === 'zh'
  const [hydration, setHydration] = useState<HydrationState>('loading')
  const [content, setContent] = useState(defaultContent)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [storeNotice, setStoreNotice] = useState<string | null>(null)
  const [activeStore, setActiveStore] = useState<DraftStore>(store)

  const derivedTitle = useMemo(() => {
    const firstLine = content.split('\n').find((line) => line.trim().length > 0)
    const cleaned = firstLine?.replace(/^#+\s*/, '').trim() ?? ''
    if (!cleaned) {
      return isChinese ? '未命名草稿' : 'Untitled draft'
    }
    return cleaned.slice(0, 80)
  }, [content, isChinese])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const drafts = await activeStore.list()
        const existingId = drafts.at(0)?.id
        if (existingId) {
          const existing = await activeStore.load(existingId)
          if (existing && !cancelled) {
            setDraftId(existing.id)
            setContent(existing.content)
            setHydration('ready')
            return
          }
        }

        const newId = await activeStore.save({ title: derivedTitle, content: defaultContent })
        if (cancelled) return
        setDraftId(newId)
        setContent(defaultContent)
        setHydration('ready')
      } catch (error) {
        console.warn('Failed to hydrate drafts from preferred store', error)
        if (fallbackStore) {
          try {
            const drafts = await fallbackStore.list()
            const existingId = drafts.at(0)?.id
            const baseContent = existingId ? (await fallbackStore.load(existingId))?.content ?? defaultContent : defaultContent
            const newId = existingId
              ? existingId
              : await fallbackStore.save({ title: derivedTitle, content: baseContent })

            if (cancelled) return
            setActiveStore(fallbackStore)
            setDraftId(newId)
            setContent(baseContent)
            setStoreNotice(
              isChinese
                ? '云端存储未启用，已切换为本地草稿箱'
                : 'Cloud storage unavailable; using local drafts instead',
            )
            setHydration('ready')
            return
          } catch (fallbackError) {
            console.warn('Failed to hydrate fallback drafts', fallbackError)
          }
        }
        if (!cancelled) {
          setHydration('error')
          setStatus(isChinese ? '草稿读取失败' : 'Failed to load drafts')
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [activeStore, derivedTitle, fallbackStore, isChinese])

  useEffect(() => {
    if (!draftId) return

    let cancelled = false
    const persist = async () => {
      try {
        const id = await activeStore.save({ id: draftId, title: derivedTitle, content })
        if (!cancelled) {
          setDraftId(id)
          setStatus(isChinese ? '已保存到本地浏览器' : 'Saved locally in this browser')
        }
      } catch (error) {
        console.warn('Failed to save draft', error)
        if (!cancelled) {
          setStatus(isChinese ? '保存失败' : 'Save failed')
        }
      }
    }

    persist()

    const timeout = window.setTimeout(() => setStatus(null), 1600)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [activeStore, content, derivedTitle, draftId, isChinese])

  const sanitizedPreview = useMemo(() => renderMarkdown(content), [content])

  const resetDraft = () => {
    setContent(defaultContent)
  }

  const headline = isChinese ? '编辑器' : 'Editor'
  const subtitle =
    mode === 'public'
      ? isChinese
        ? '无需登录 · 草稿仅存储在本地，未来支持云端同步'
        : 'No sign-in required · Drafts stay in this browser; cloud sync is planned'
      : isChinese
        ? '登录后将开放云端保存，当前版本使用本地草稿箱'
        : 'Cloud save will be enabled for signed-in users; currently using local drafts'

  if (hydration === 'loading') {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12 text-slate-200">
        <p className="text-sm opacity-80">{isChinese ? '正在加载编辑器…' : 'Loading editor…'}</p>
      </div>
    )
  }

  if (hydration === 'error') {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12 text-rose-200">
        <p className="text-sm font-semibold">{isChinese ? '编辑器初始化失败' : 'Editor failed to initialize'}</p>
        <p className="mt-2 text-xs text-rose-100/80">
          {isChinese ? '请刷新页面或稍后重试。' : 'Please refresh or try again later.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 lg:py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">{headline}</p>
          <h1 className="mt-2 text-3xl font-bold text-white lg:text-4xl">NeuraPress · {isChinese ? '内容工作台' : 'Content Studio'}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 lg:text-base">{subtitle}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-100">
            {status ?? storeNotice ?? (isChinese ? '仅本地保存 · 未来支持云端账号' : 'Local-only save · SaaS sync coming soon')}
          </div>
        </div>
        <div className="hidden flex-col items-end gap-2 text-right text-xs text-slate-400 sm:flex">
          <span>{mode === 'public' ? (isChinese ? '无需登录 · 本地存储' : 'No sign-in required · Local storage only') : isChinese ? '登录后将提供云端草稿' : 'Cloud drafts will be available after sign-in'}</span>
          <button
            type="button"
            onClick={resetDraft}
            className="rounded-md border border-white/10 px-3 py-1 text-slate-100 transition hover:border-indigo-300/60 hover:bg-indigo-500/10"
          >
            {isChinese ? '恢复示例内容' : 'Reset to sample'}
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex min-h-[520px] flex-col rounded-2xl border border-white/10 bg-slate-900/80 shadow-xl shadow-indigo-900/30">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              {isChinese ? '编辑区' : 'Editor'}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline">{isChinese ? '草稿箱' : 'Drafts'}</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-indigo-100">Local</span>
            </div>
          </div>
          <textarea
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
            value={content}
            spellCheck={false}
            onChange={(event) => setContent(event.target.value)}
            placeholder={isChinese ? '在此编写 Markdown 内容…' : 'Write your markdown content here…'}
          />
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-slate-400">
            <span>{isChinese ? '自动保存到本地草稿箱' : 'Auto-saved locally'}</span>
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-md px-2 py-1 text-indigo-200 transition hover:bg-indigo-500/10"
            >
              {isChinese ? '重置示例' : 'Reset sample'}
            </button>
          </div>
        </div>

        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-xl shadow-indigo-900/30">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden="true" />
              {isChinese ? '预览' : 'Preview'}
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">WYSIWYG</div>
          </div>
          <div className="prose prose-invert max-w-none flex-1 overflow-auto bg-slate-950/70 px-5 py-4 prose-pre:bg-slate-900 prose-pre:text-[13px] prose-pre:leading-6 prose-headings:mb-3 prose-headings:mt-6">
            <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
          </div>
          <div className="flex flex-col gap-2 border-t border-white/10 bg-slate-900/80 px-4 py-3 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p className="leading-5">
              {isChinese
                ? '预览模拟 NeuraPress 的排版逻辑，编辑核心保持不变，目前仅限本地草稿保存。'
                : 'Preview mirrors NeuraPress formatting. Editing logic stays intact, currently limited to local drafts.'}
            </p>
            <Link
              href="https://github.com/tianyaxiang/neurapress"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1 text-indigo-100 transition hover:border-indigo-300/60 hover:bg-indigo-500/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H7" />
              </svg>
              <span>{isChinese ? '查看 NeuraPress' : 'NeuraPress project'}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200 shadow-lg shadow-indigo-900/30">
          <h3 className="text-base font-semibold text-white">{isChinese ? '集成说明' : 'Integration notes'}</h3>
          <p className="mt-2 leading-6 text-slate-300">
            {isChinese
              ? 'NeuraPress 作为编辑器内核以 vendor 方式引入，路由、权限与存储策略由本站包装。'
              : 'NeuraPress is vendored as the editor core; routing, permissions, and storage strategy are provided by this site.'}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {isChinese
              ? '当前版本仅支持本地草稿。云端草稿与模板管理将于 SaaS 版本开放。'
              : 'Local drafts only for now. Cloud drafts and template management will ship with the SaaS tier.'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200 shadow-lg shadow-indigo-900/30">
          <h3 className="text-base font-semibold text-white">{isChinese ? '版权声明' : 'Credit & license'}</h3>
          <p className="mt-2 leading-6 text-slate-300">
            {isChinese
              ? '上游 NeuraPress 由 tianyaxiang 基于 MIT 协议发布。本集成保留原作者署名，并在 vendor 目录存放 LICENSE 与 NOTICE。'
              : 'Upstream NeuraPress is published by tianyaxiang under MIT. This integration preserves attribution with LICENSE and NOTICE under vendor.'}
          </p>
        </div>
      </div>
    </div>
  )
}
