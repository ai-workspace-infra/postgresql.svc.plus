'use client'

import { useState } from 'react'
import { InsightState } from '../../insight/store/urlState'
import { TimeRangePicker } from './TimeRangePicker'

interface BreadcrumbBarProps {
  state: InsightState
  updateState: (partial: Partial<InsightState>) => void
  shareableLink: string
}

const orgs = ['global-org', 'retail-hub', 'fintech-lab']
const projects = ['observability', 'payments', 'edge']
const envs = ['production', 'staging', 'dev']
const regions = ['us-west-2', 'eu-central-1', 'ap-southeast-1']

export function BreadcrumbBar({ state, updateState, shareableLink }: BreadcrumbBarProps) {
  const [copied, setCopied] = useState(false)
  const canCopy = Boolean(shareableLink)

  async function handleCopy() {
    if (!canCopy) {
      return
    }
    try {
      await navigator.clipboard.writeText(shareableLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-3 text-sm text-slate-200">
      <Selector label="Org" value={state.org} options={orgs} onChange={org => updateState({ org })} />
      <Separator />
      <Selector label="Environment" value={state.env} options={envs} onChange={env => updateState({ env })} />
      <Separator />
      <Selector label="Region" value={state.region} options={regions} onChange={region => updateState({ region })} />
      <Separator />
      <Selector label="Project" value={state.project} options={projects} onChange={project => updateState({ project })} />
      <Separator />
      <TimeRangePicker state={state} updateState={updateState} />
      <button
        onClick={handleCopy}
        disabled={!canCopy}
        className={`ml-auto flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition ${
          canCopy ? 'hover:bg-slate-800' : 'opacity-60 cursor-not-allowed'
        }`}
        aria-disabled={!canCopy}
      >
        {copied ? 'Link copied!' : canCopy ? 'Copy share link' : 'Generating share link...'}
      </button>
    </div>
  )
}

function Selector({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="flex min-w-[160px] flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 shadow-inner">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-medium focus:outline-none"
      >
        {options.map(option => (
          <option key={option} value={option} className="bg-slate-900">
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function Separator() {
  return <span className="text-slate-600">/</span>
}
