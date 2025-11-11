'use client'

import { InsightState } from '../../insight/store/urlState'
import { BreadcrumbBar } from './BreadcrumbBar'

interface WorkspaceHeaderProps {
  state: InsightState
  updateState: (partial: Partial<InsightState>) => void
  shareableLink: string
  statusMessage?: string | null
  showBreadcrumb?: boolean
}

export function WorkspaceHeader({
  state,
  updateState,
  shareableLink,
  statusMessage,
  showBreadcrumb = true
}: WorkspaceHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-5 shadow-lg shadow-slate-950/20">
      <div className="space-y-2">
        {showBreadcrumb && (
          <BreadcrumbBar state={state} updateState={updateState} shareableLink={shareableLink} />
        )}
        <p className="text-xs text-slate-400">
          Drag any panel handle to reorganize the workspace. Saved layouts stay local to your browser.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          Shareable link:{' '}
          <span className="text-slate-200">{shareableLink || 'State syncs in the URL hash for collaboration.'}</span>
        </span>
        {statusMessage ? (
          <span className="text-emerald-300">{statusMessage}</span>
        ) : (
          <span>Changes you save apply only to this device.</span>
        )}
      </div>
    </header>
  )
}
