'use client'

interface QueryHistoryPanelProps {
  history: string[]
  onInsert: (query: string) => void
  onClear: () => void
}

export function QueryHistoryPanel({ history, onInsert, onClear }: QueryHistoryPanelProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Recent queries</h3>
        <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-200">
          Clear
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-xs text-slate-500">Run queries to build a local history.</p>
      ) : (
        <ul className="space-y-2 text-xs text-slate-300">
          {history.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <code className="block whitespace-pre-wrap break-all text-slate-200">{item}</code>
              <button onClick={() => onInsert(item)} className="mt-2 text-[11px] font-medium text-emerald-300">
                Insert into builder
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
