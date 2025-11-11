'use client'

interface QueryChipsProps {
  labels: string[]
  onRemove: (label: string) => void
}

export function QueryChips({ labels, onRemove }: QueryChipsProps) {
  if (!labels.length) {
    return <p className="text-xs text-slate-500">No label filters applied.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map(label => (
        <span
          key={label}
          className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-200"
        >
          {label}
          <button onClick={() => onRemove(label)} className="text-slate-400 hover:text-slate-200">
            ×
          </button>
        </span>
      ))}
    </div>
  )
}
