interface Source {
  repo: string
  path: string
}

export function SourceHint({ sources }: { sources: Source[] }) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="mt-4 text-sm text-gray-500 border-t pt-3">
      Sources used:
      <ul className="list-disc ml-6 mt-2">
        {sources.map((s, i) => (
          <li key={i}>
            <strong>{s.repo}:</strong> {s.path}
          </li>
        ))}
      </ul>
    </div>
  )
}
