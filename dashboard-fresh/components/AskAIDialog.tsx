'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ChatBubble } from './ChatBubble'
import { SourceHint } from './SourceHint'

const MAX_MESSAGES = 20
const MAX_CACHE_SIZE = 50

function normalizeInput(text: string) {
  return text
    .trim()
    .replace(/[\s.,!?;:，。！？；：]+$/u, '')
    .replace(/```[\s\S]*?```/g, '')
}

function renderMarkdown(text: string) {
  // marked.parse has a return type of string | Promise<string>
  // but in our usage it executes synchronously. Cast to string to
  // satisfy the DOMPurify.sanitize type expectations.
  return DOMPurify.sanitize(marked.parse(text) as string)
}

type InitialQuestionPayload = {
  key: number
  text: string
}

export function AskAIDialog({
  open,
  onMinimize,
  onEnd,
  initialQuestion
}: {
  open: boolean
  onMinimize: () => void
  onEnd: () => void
  initialQuestion?: InitialQuestionPayload
}) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([])
  const [sources, setSources] = useState<any[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const cacheRef = useRef(
    new Map<string, { answer: string; sources: any[]; timestamp: number }>()
  )
  const requestIdRef = useRef(0)
  const processedInitialRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const streamChat = useCallback(async (
    url: string,
    body: any,
    update: (text: string, src?: any[]) => void,
    timeout = 15000
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    let timer: NodeJS.Timeout | null = null
    const scheduleAbort = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => controller.abort(), timeout)
    }
    scheduleAbort()
    abortRef.current = controller

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      if (!res.ok) throw new Error('Request failed')

      const contentType = res.headers.get('content-type') || ''
      // Handle non-streaming JSON responses directly.
      if (!contentType.includes('text/event-stream')) {
        const data = await res.json().catch(() => ({}))
        let answer = typeof data === 'string' ? data : data.answer || ''
        let retrieved = data.chunks || data.sources || []
        update(answer, retrieved)
        return { answer, retrieved }
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let buffer = ''
      let answer = ''
      let retrieved: any[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        scheduleAbort()
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          const line = part.split('\n').find(l => l.startsWith('data:'))
          if (!line) {
            answer += part
            update(answer, retrieved)
            continue
          }
          const dataStr = line.replace(/^data: ?/, '').trim()
          if (dataStr === '[DONE]') continue
          try {
            const json = JSON.parse(dataStr)
            if (json.answer) answer += json.answer
            else if (typeof json === 'string') answer += json
            if (json.chunks) retrieved = json.chunks
            if (json.sources) retrieved = json.sources
          } catch {
            answer += dataStr
          }
          update(answer, retrieved)
        }
      }

      update(answer, retrieved)
      return { answer, retrieved }
    } finally {
      if (timer) clearTimeout(timer)
      if (abortRef.current === controller) abortRef.current = null
    }
  }, [])

  const performAsk = useCallback(async (override?: string) => {
    const inputValue = override ?? question
    const normalized = normalizeInput(inputValue)
    if (!normalized) return
    const now = Date.now()
    const cached = cacheRef.current.get(normalized)
    if (cached && now - cached.timestamp < 10000) {
      cacheRef.current.delete(normalized)
      cacheRef.current.set(normalized, { ...cached, timestamp: now })
      const userMessage = {
        sender: 'user' as const,
        text: renderMarkdown(normalized)
      }
      const aiMessage = {
        sender: 'ai' as const,
        text: renderMarkdown(cached.answer)
      }
      setMessages(prev => [...prev, userMessage, aiMessage].slice(-MAX_MESSAGES))
      setSources(cached.sources)
      setQuestion('')
      return
    }

    const id = ++requestIdRef.current
    const userMessage = {
      sender: 'user' as const,
      text: renderMarkdown(normalized)
    }
    const history = [...messages.slice(-MAX_MESSAGES + 1), userMessage]
    setMessages(prev => [...prev, userMessage, { sender: 'ai', text: '' }])
    setQuestion('')

    const updateAI = (text: string, src?: any[]) => {
      if (id !== requestIdRef.current) return
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { sender: 'ai', text: renderMarkdown(text) }
        return next
      })
      if (src) setSources(src)
    }

    try {
      let ragAnswer = ''
      let ragRetrieved: any[] = []
      let ragError: any = null

      try {
        const result = await streamChat(
          '/api/rag/query',
          { question: normalized, history },
          updateAI
        )
        ragAnswer = result?.answer ?? ''
        ragRetrieved = Array.isArray(result?.retrieved) ? result.retrieved : []
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          throw err
        }
        ragError = err
      }

      if (ragError) {
        console.warn('RAG query failed, falling back to /api/askai', ragError)
      }

      let answer = ragAnswer
      let retrieved = ragRetrieved

      if (!answer || retrieved.length === 0 || ragError) {
        if (!ragError && !answer) {
          console.warn('RAG query returned empty answer, falling back to /api/askai')
        } else if (!ragError && retrieved.length === 0) {
          console.warn('RAG query returned no relevant chunks, falling back to /api/askai')
        }

        try {
          const result = await streamChat(
            '/api/askai',
            { question: normalized, history },
            updateAI
          )
          if (result?.answer) {
            answer = result.answer
          }
          if (Array.isArray(result?.retrieved) && result.retrieved.length > 0) {
            retrieved = result.retrieved
          }
        } catch (fallbackError: any) {
          if (fallbackError?.name === 'AbortError') {
            throw fallbackError
          }
          console.error('Fallback /api/askai failed', fallbackError)
          if (!answer) {
            updateAI('Sorry, I could not find an answer at this time.')
            return
          }
        }

        if (!answer) {
          answer = 'Sorry, I could not find an answer at this time.'
          updateAI(answer)
          return
        }
        if (retrieved.length === 0) {
          answer +=
            '\n\n_Note: No relevant documents were found; this answer may be inaccurate._'
          updateAI(answer)
        }
      }

      if (cacheRef.current.size >= MAX_CACHE_SIZE) {
        const oldest = cacheRef.current.keys().next().value
        if (oldest !== undefined) {
          cacheRef.current.delete(oldest)
        }
      }
      cacheRef.current.set(normalized, {
        answer,
        sources: retrieved,
        timestamp: now
      })
    } catch (err: any) {
      if (id !== requestIdRef.current) return
      let message = 'Something went wrong. Please try again later.'
      if (err.name === 'AbortError') message = 'Request was cancelled.'
      else if (err.message?.includes('Failed to fetch'))
        message = 'Network error. Please check your connection.'
      else if (err.message) message = err.message
      updateAI(message)
    }
  }, [messages, question, streamChat])

  function handleAsk() {
    abortRef.current?.abort()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performAsk(), 300)
  }

  function handleEnd() {
    setMessages([])
    setQuestion('')
    setSources([])
    processedInitialRef.current = null
    onEnd()
  }

  useEffect(() => {
    if (!open) {
      processedInitialRef.current = null
      return
    }
    if (!initialQuestion) return
    if (processedInitialRef.current === initialQuestion.key) return
    const normalizedInitial = normalizeInput(initialQuestion.text)
    if (!normalizedInitial) return
    processedInitialRef.current = initialQuestion.key
    setQuestion(normalizedInitial)
    performAsk(normalizedInitial)
  }, [initialQuestion, open, performAsk])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden md:block flex-1 bg-black/40" onClick={onMinimize} />
      <div className="w-full md:w-1/2 h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Ask anything about your docs</h2>
          <div className="flex gap-2 text-gray-500">
            <button onClick={onMinimize} className="hover:text-gray-800" title="Minimize">
              –
            </button>
            <button onClick={handleEnd} className="hover:text-gray-800" title="End conversation">
              End
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-gray-800 space-y-4">
          {messages.map((m, idx) => (
            <ChatBubble key={idx} message={m.text} type={m.sender} />
          ))}
          {sources.length > 0 && <SourceHint sources={sources} />}
        </div>

        <div className="border-t p-4">
          <textarea
            className="w-full border p-3 rounded-lg mb-4 text-black"
            rows={3}
            placeholder="Type your question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAsk()
              }
            }}
          />
          <button
            onClick={handleAsk}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}
