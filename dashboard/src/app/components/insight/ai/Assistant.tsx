'use client'

import { useMemo, useState } from 'react'
import { InsightState } from '../../insight/store/urlState'

const quickActions = [
  { id: 'explain', label: 'Explain anomaly', prompt: 'Explain the recent anomaly in my metrics.' },
  { id: 'logs', label: 'Fetch related logs', prompt: 'Show me logs correlated with the current filters.' },
  { id: 'rca', label: 'Root cause analysis', prompt: 'Run an RCA for the checkout service using metrics, logs and traces.' },
  { id: 'alert', label: 'Draft alert', prompt: 'Generate an alert rule for p95 latency over 300ms.' },
  { id: 'report', label: 'Incident report', prompt: 'Create a short incident report for the last hour.' }
]

interface AssistantProps {
  state: InsightState
}

export function AIAssistant({ state }: AssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<{ question: string; timestamp: number }[]>([])
  const [conversation, setConversation] = useState<
    { author: 'user' | 'ai'; text: string; timestamp: number }[]
  >([])

  const contextSummary = useMemo(
    () =>
      `Org=${state.org}, Project=${state.project}, Env=${state.env}, Region=${state.region}, Topology=${state.topologyMode}, Service=${state.service || 'all'}, Time=${state.timeRange}`,
    [state]
  )

  function openPanel(prompt?: string) {
    setIsOpen(true)
    setIsMinimized(false)
    if (prompt) {
      appendMessage(prompt)
    }
  }

  function appendMessage(prompt: string) {
    const timestamp = Date.now()
    const updatedHistory = [{ question: prompt, timestamp }, ...history].slice(0, 10)
    setHistory(updatedHistory)
    setConversation(prev => [
      ...prev,
      { author: 'user', text: prompt, timestamp },
      {
        author: 'ai',
        text: `Using context (${contextSummary}) I will draft insights for “${prompt}”. Connect me to your backend to replace this placeholder response.`,
        timestamp: timestamp + 1
      }
    ])
  }

  function handleSend() {
    if (!message.trim()) return
    appendMessage(message.trim())
    setMessage('')
  }

  function toggleMinimize() {
    setIsMinimized(prev => !prev)
  }

  function toggleMaximize() {
    setIsMaximized(prev => !prev)
    setIsMinimized(false)
  }

  function closePanel() {
    setIsOpen(false)
    setIsMinimized(false)
    setIsMaximized(false)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/20">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">AI Assistant</h3>
        <p className="text-xs text-slate-400">Bring AskAI insights into your observability workflow.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {quickActions.map(action => (
          <button
            key={action.id}
            onClick={() => openPanel(action.prompt)}
            className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-emerald-500/60"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Current context</p>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{contextSummary}</p>
      </div>
      <div className="space-y-2 text-xs text-slate-300">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Recent questions</p>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">Run a quick action or open the assistant to get started.</p>
        ) : (
          <ul className="space-y-1">
            {history.map(item => (
              <li key={item.timestamp} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                <span className="text-slate-200">{item.question}</span>
                <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        onClick={() => openPanel('Help me explore the current observability context.')}
        className="w-full rounded-xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-emerald-950"
      >
        Open assistant
      </button>

      {isOpen && (
        <div
          className={`fixed right-6 z-40 flex flex-col rounded-3xl border border-emerald-500/30 bg-slate-950/95 shadow-2xl transition-all ${
            isMaximized ? 'top-6 bottom-6 w-[420px] lg:w-[460px]' : 'bottom-10 w-[360px] lg:w-[400px]'
          } ${isMinimized ? 'h-14 overflow-hidden' : 'max-h-[85vh]'}`}
        >
          <div className="flex items-center justify-between border-b border-emerald-500/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">AI copilot</p>
              {!isMinimized && (
                <p className="text-[11px] text-slate-400">Context aware responses for the current workspace.</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <button onClick={toggleMinimize} className="rounded-lg border border-transparent px-2 py-1 hover:border-slate-700">
                {isMinimized ? 'Restore' : 'Minimize'}
              </button>
              <button onClick={toggleMaximize} className="rounded-lg border border-transparent px-2 py-1 hover:border-slate-700">
                {isMaximized ? 'Default size' : 'Maximize'}
              </button>
              <button onClick={closePanel} className="rounded-lg border border-transparent px-2 py-1 hover:border-slate-700">
                Close
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {conversation.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Ask a question to start a conversation. The assistant replies with enriched placeholders until wired to
                  your backend.
                </p>
              ) : (
                <ul className="space-y-3">
                  {conversation.map(entry => (
                    <li
                      key={entry.timestamp}
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        entry.author === 'user'
                          ? 'bg-emerald-500/10 text-emerald-100'
                          : 'bg-slate-900/80 text-slate-200'
                      }`}
                    >
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {entry.author === 'user' ? 'You' : 'Assistant'} · {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">{entry.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!isMinimized && (
            <div className="border-t border-emerald-500/10 bg-slate-950/80 px-4 py-3">
              <textarea
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder="Ask anything about this observability view…"
                className="h-20 w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-200"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Responses include context automatically.</span>
                <button
                  onClick={handleSend}
                  className="rounded-xl bg-emerald-500/80 px-3 py-1.5 text-xs font-semibold text-emerald-950"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
