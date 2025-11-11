'use client'

import { InsightState } from '../../insight/store/urlState'
import { formatDuration } from '@lib/format'

interface TimeRangePickerProps {
  state: InsightState
  updateState: (partial: Partial<InsightState>) => void
}

const ranges = ['15m', '1h', '6h', '24h', '7d']

export function TimeRangePicker({ state, updateState }: TimeRangePickerProps) {
  return (
    <label className="flex min-w-[160px] flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200 shadow-inner">
      <span className="text-xs uppercase tracking-wide text-slate-500">Time range</span>
      <select
        value={state.timeRange}
        onChange={event => updateState({ timeRange: event.target.value })}
        className="w-full bg-transparent text-sm font-medium focus:outline-none"
      >
        {ranges.map(range => (
          <option key={range} value={range} className="bg-slate-900">
            {formatDuration(range)}
          </option>
        ))}
        <option value="custom" className="bg-slate-900">
          Custom window
        </option>
      </select>
    </label>
  )
}
